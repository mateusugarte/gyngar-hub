import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { IcpAgent } from './icp-agent'

export default async function IcpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: ctx } = await supabase
    .from('user_marketing_context')
    .select('context')
    .eq('user_id', user.id)
    .single()

  const existingContext = (ctx?.context as Record<string, unknown>) ?? {}

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '14px 24px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--text-secondary)' }}>
            DEFINIÇÃO DE ICP
          </span>
          <span style={{ padding: '2px 7px', background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', borderRadius: '4px' }}>
            <span className="font-mono text-[9px] uppercase tracking-[0.06em]" style={{ color: 'var(--accent-text)' }}>IA</span>
          </span>
        </div>
        {Object.keys(existingContext).length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
            <span className="font-mono text-[9px] uppercase tracking-[0.08em]" style={{ color: 'var(--success)' }}>
              CONTEXTO ATIVO
            </span>
          </div>
        )}
      </div>

      {/* Agent */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <IcpAgent existingContext={existingContext} />
      </div>
    </div>
  )
}
