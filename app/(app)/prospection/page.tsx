import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProspectionClient } from './components/prospection-client'
import { LeadsCaptados } from './components/leads-captados'

export default async function ProspectionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check if user has Apify key
  const { data: settings } = await supabase
    .from('user_settings')
    .select('apify_api_key')
    .eq('user_id', user.id)
    .single()

  const hasApifyKey = !!(settings?.apify_api_key)

  // Fetch scraping jobs
  const { data: jobs } = await supabase
    .from('scraping_jobs')
    .select('id, fonte, status, total_coletado, total_qualificados, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Fetch API-sourced leads
  const { data: leadsApi } = await supabase
    .from('leads_qualified')
    .select('id, nome, instagram, empresa, nicho, cidade, score, origem, created_at')
    .eq('user_id', user.id)
    .in('origem', ['instagram_comentario', 'instagram_seguidor', 'google_maps'])
    .order('created_at', { ascending: false })
    .limit(100)

  // Fetch IG isca leads
  const { data: leadsIg } = await supabase
    .from('leads_instagram')
    .select('id, ig_username, comentario, data_captura')
    .eq('user_id', user.id)
    .order('data_captura', { ascending: false })
    .limit(100)

  const captadosContent = (
    <LeadsCaptados
      jobs={jobs ?? []}
      leadsApi={leadsApi ?? []}
      leadsIg={leadsIg ?? []}
    />
  )

  return (
    <ProspectionClient
      captadosContent={captadosContent}
      hasApifyKey={hasApifyKey}
    />
  )
}
