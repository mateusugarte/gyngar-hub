import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ObjectivesWizard } from './objectives-wizard'

export default async function ObjectivesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: ctx } = await supabase
    .from('user_marketing_context')
    .select('context')
    .eq('user_id', user.id)
    .single()

  return <ObjectivesWizard initialContext={(ctx?.context as Record<string, unknown>) ?? {}} />
}
