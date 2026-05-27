import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AgentPageClient } from './components/agent-page-client'

export default async function AgentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: conversations } = await supabase
    .from('chat_conversations')
    .select('id, titulo, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AgentPageClient initialConversations={conversations ?? []} />
    </div>
  )
}
