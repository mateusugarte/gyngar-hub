import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { IdeasClient } from './ideas-client'

export default async function IdeasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: ideas } = await supabase
    .from('content_ideas')
    .select('id, titulo, tipo, pilar, objetivo, status, data_agendada, palavra_isca, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: ctx } = await supabase
    .from('user_marketing_context')
    .select('context')
    .eq('user_id', user.id)
    .single()

  return (
    <IdeasClient
      ideas={ideas ?? []}
      marketingContext={(ctx?.context as Record<string, unknown>) ?? {}}
    />
  )
}
