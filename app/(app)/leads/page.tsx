import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LeadsClient } from './components/leads-client'
import { LeadsMetrics } from './components/leads-metrics'
import { DateRangeFilter } from './components/date-range-filter'
import { getDateRange } from './lib/date-range'
import type { Lead } from './components/lead-card'

interface LeadsPageProps {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const params = await searchParams
  const range = (params.range as 'semana' | 'mes' | 'personalizado') ?? 'semana'
  const { from, to } = getDateRange(range, params.from, params.to)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: leads } = await supabase
    .from('leads_qualified')
    .select('*')
    .gte('created_at', from.toISOString())
    .lte('created_at', to.toISOString())
    .order('created_at', { ascending: false })

  return (
    <div className="anim-page" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px' }}>
      {/* Page header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '20px', flexWrap: 'wrap', gap: '12px',
      }}>
        <span
          className="font-mono text-[10px] uppercase tracking-[0.1em]"
          style={{ color: 'var(--text-secondary)' }}
        >
          LEADS / PIPELINE
        </span>
        <DateRangeFilter current={range} from={params.from} to={params.to} />
      </div>

      {/* Content: Kanban + Metrics sidebar */}
      <div style={{ display: 'flex', gap: '24px', flex: 1, overflow: 'hidden' }}>
        {/* Kanban area */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <LeadsClient
            initialLeads={(leads ?? []) as Lead[]}
            userId={user.id}
          />
        </div>

        {/* Metrics sidebar */}
        <Suspense fallback={
          <div style={{ width: '180px', flexShrink: 0 }}>
            <span className="font-mono text-[9px] uppercase" style={{ color: 'var(--text-disabled)' }}>
              [CARREGANDO...]
            </span>
          </div>
        }>
          <LeadsMetrics from={from} to={to} />
        </Suspense>
      </div>
    </div>
  )
}
