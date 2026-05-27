import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { startIgCommentScrape } from '@/lib/apify/ig-comments'
import { startIgFollowerScrape } from '@/lib/apify/ig-followers'
import { startGMapsScrape } from '@/lib/apify/gmaps'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get user Apify key
  const { data: settings } = await supabase
    .from('user_settings')
    .select('apify_api_key')
    .eq('user_id', user.id)
    .single()

  if (!settings?.apify_api_key) {
    return NextResponse.json({ error: 'Chave Apify não configurada' }, { status: 400 })
  }

  const body = await req.json() as {
    fonte: 'ig_comentarios' | 'ig_seguidores' | 'google_maps'
    filtros: Record<string, unknown>
  }

  let apifyRunId: string

  try {
    if (body.fonte === 'ig_comentarios') {
      const postUrls = (body.filtros.postUrls as string[] | undefined) ?? []
      if (!postUrls.length) return NextResponse.json({ error: 'URLs dos posts são obrigatórias' }, { status: 400 })
      apifyRunId = await startIgCommentScrape(settings.apify_api_key, {
        postUrls,
        maxComments: (body.filtros.maxComments as number | undefined) ?? 200,
      })
    } else if (body.fonte === 'ig_seguidores') {
      const username = body.filtros.username as string | undefined
      if (!username) return NextResponse.json({ error: 'Username do Instagram é obrigatório' }, { status: 400 })
      apifyRunId = await startIgFollowerScrape(settings.apify_api_key, {
        username,
        maxFollowers: (body.filtros.maxFollowers as number | undefined) ?? 500,
      })
    } else if (body.fonte === 'google_maps') {
      const searchTerms = (body.filtros.searchTerms as string[] | undefined) ?? []
      if (!searchTerms.length) return NextResponse.json({ error: 'Termos de busca são obrigatórios' }, { status: 400 })
      apifyRunId = await startGMapsScrape(settings.apify_api_key, {
        searchTerms,
        maxResults: (body.filtros.maxResults as number | undefined) ?? 100,
        city: body.filtros.city as string | undefined,
      })
    } else {
      return NextResponse.json({ error: 'Fonte inválida' }, { status: 400 })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao iniciar scraping'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // Create scraping_job record
  const { data: job, error: jobError } = await supabase
    .from('scraping_jobs')
    .insert({
      user_id: user.id,
      fonte: body.fonte,
      apify_run_id: apifyRunId,
      status: 'rodando',
      filtros: body.filtros as import('@/types/database.types').Json,
    })
    .select('id')
    .single()

  if (jobError) {
    return NextResponse.json({ error: jobError.message }, { status: 500 })
  }

  return NextResponse.json({ jobId: job.id, apifyRunId })
}
