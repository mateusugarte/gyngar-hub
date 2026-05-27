import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRunStatus } from '@/lib/apify/run-status'
import { getIgCommentResults } from '@/lib/apify/ig-comments'
import { getIgFollowerResults } from '@/lib/apify/ig-followers'
import { getGMapsResults } from '@/lib/apify/gmaps'
import { enrichLead } from '@/lib/anthropic/enrich-lead'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const jobId = req.nextUrl.searchParams.get('jobId')
  if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })

  const { data: job } = await supabase
    .from('scraping_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .single()

  if (!job) return NextResponse.json({ error: 'Job não encontrado' }, { status: 404 })

  // Already finished
  if (job.status === 'concluido' || job.status === 'erro') {
    return NextResponse.json({ status: job.status, totalColetado: job.total_coletado, totalQualificados: job.total_qualificados })
  }

  if (!job.apify_run_id) {
    return NextResponse.json({ status: job.status })
  }

  // Get Apify key
  const { data: settings } = await supabase
    .from('user_settings')
    .select('apify_api_key')
    .eq('user_id', user.id)
    .single()

  if (!settings?.apify_api_key) {
    return NextResponse.json({ error: 'Chave Apify não configurada' }, { status: 400 })
  }

  let apifyStatus: Awaited<ReturnType<typeof getRunStatus>>
  try {
    apifyStatus = await getRunStatus(settings.apify_api_key, job.apify_run_id)
  } catch {
    return NextResponse.json({ status: 'rodando' })
  }

  if (apifyStatus.status === 'RUNNING' || apifyStatus.status === 'READY') {
    return NextResponse.json({ status: 'rodando' })
  }

  if (apifyStatus.status !== 'SUCCEEDED') {
    await supabase.from('scraping_jobs').update({ status: 'erro' }).eq('id', jobId)
    return NextResponse.json({ status: 'erro' })
  }

  // Fetch results and process
  let rawItems: Record<string, unknown>[] = []
  try {
    if (job.fonte === 'ig_comentarios') {
      rawItems = (await getIgCommentResults(settings.apify_api_key, job.apify_run_id)) as unknown as Record<string, unknown>[]
    } else if (job.fonte === 'ig_seguidores') {
      rawItems = (await getIgFollowerResults(settings.apify_api_key, job.apify_run_id)) as unknown as Record<string, unknown>[]
    } else if (job.fonte === 'google_maps') {
      rawItems = (await getGMapsResults(settings.apify_api_key, job.apify_run_id)) as unknown as Record<string, unknown>[]
    }
  } catch {
    await supabase.from('scraping_jobs').update({ status: 'erro' }).eq('id', jobId)
    return NextResponse.json({ status: 'erro' })
  }

  // Get marketing context for enrichment
  const { data: mktCtx } = await supabase
    .from('user_marketing_context')
    .select('context')
    .eq('user_id', user.id)
    .single()

  let totalQualificados = 0
  for (const item of rawItems.slice(0, 50)) { // limit to 50 to avoid token overuse
    try {
      const raw = normalizeRaw(item, job.fonte as string)
      const enriched = await enrichLead(raw, (mktCtx?.context as Record<string, unknown>) ?? {})

      if (!enriched.qualificado) continue
      totalQualificados++

      await supabase.from('leads_qualified').upsert(
        {
          user_id: user.id,
          nome: enriched.nome,
          instagram: enriched.instagram ?? null,
          telefone: enriched.telefone ?? null,
          email: enriched.email ?? null,
          empresa: enriched.empresa ?? null,
          nicho: enriched.nicho ?? null,
          cidade: enriched.cidade ?? null,
          site: enriched.site ?? null,
          score: enriched.score,
          observacoes: enriched.observacoes,
          origem: mapFonteToOrigem(job.fonte as string),
          etapa: 'primeiro_contato',
          data_entrada_etapa: new Date().toISOString(),
        },
        { onConflict: 'user_id,instagram', ignoreDuplicates: false }
      )
    } catch {
      // skip failed enrichments
    }
  }

  await supabase.from('scraping_jobs').update({
    status: 'concluido',
    total_coletado: rawItems.length,
    total_qualificados: totalQualificados,
  }).eq('id', jobId)

  return NextResponse.json({
    status: 'concluido',
    totalColetado: rawItems.length,
    totalQualificados,
  })
}

function normalizeRaw(item: Record<string, unknown>, fonte: string) {
  if (fonte === 'ig_comentarios') {
    return {
      nome: (item.ownerFullName as string | undefined) ?? (item.ownerUsername as string | undefined) ?? '',
      instagram: item.ownerUsername as string | undefined,
      descricao: item.text as string | undefined,
      fonte: 'ig_comentarios' as const,
    }
  }
  if (fonte === 'ig_seguidores') {
    return {
      nome: (item.fullName as string | undefined) ?? (item.username as string | undefined) ?? '',
      instagram: item.username as string | undefined,
      site: item.externalUrl as string | undefined,
      descricao: item.biography as string | undefined,
      seguidores: item.followersCount as number | undefined,
      fonte: 'ig_seguidores' as const,
    }
  }
  // google_maps
  return {
    nome: item.title as string | undefined,
    empresa: item.title as string | undefined,
    telefone: item.phone as string | undefined,
    site: item.website as string | undefined,
    cidade: item.city as string | undefined,
    nicho: item.categoryName as string | undefined,
    descricao: item.description as string | undefined,
    fonte: 'google_maps' as const,
  }
}

function mapFonteToOrigem(fonte: string) {
  if (fonte === 'ig_comentarios') return 'instagram_comentario'
  if (fonte === 'ig_seguidores') return 'instagram_seguidor'
  if (fonte === 'google_maps') return 'google_maps'
  return 'manual'
}
