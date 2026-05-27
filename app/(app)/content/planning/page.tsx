import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PlanningWizard } from './planning-wizard'

export default async function PlanningPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()

  const { data: ideas } = await supabase
    .from('content_ideas')
    .select('id, titulo, tipo, pilar, status')
    .eq('user_id', user.id)
    .in('status', ['ideia', 'producao'])
    .order('created_at', { ascending: false })

  return (
    <PlanningWizard
      defaultYear={now.getFullYear()}
      defaultMonth={now.getMonth()}
      availableIdeas={ideas ?? []}
    />
  )
}
