import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarView } from './calendar-view'

interface Props {
  searchParams: Promise<{ month?: string; year?: string }>
}

export default async function CalendarPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const now = new Date()
  const year = params.year ? parseInt(params.year) : now.getFullYear()
  const month = params.month ? parseInt(params.month) : now.getMonth()

  const firstDay = new Date(year, month, 1).toISOString().split('T')[0]
  const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0]

  const { data: calendarEntries } = await supabase
    .from('content_calendar')
    .select('id, idea_id, data_planejada, status, content_ideas(id, titulo, tipo, pilar, status)')
    .eq('user_id', user.id)
    .gte('data_planejada', firstDay)
    .lte('data_planejada', lastDay)
    .order('data_planejada')

  const { data: ideas } = await supabase
    .from('content_ideas')
    .select('id, titulo, tipo, pilar, status')
    .eq('user_id', user.id)
    .in('status', ['ideia', 'producao'])
    .order('created_at', { ascending: false })

  return (
    <CalendarView
      year={year}
      month={month}
      entries={calendarEntries ?? []}
      ideas={ideas ?? []}
    />
  )
}
