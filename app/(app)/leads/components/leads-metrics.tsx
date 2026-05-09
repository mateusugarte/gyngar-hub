import { createClient } from '@/lib/supabase/server'

interface MetricCardProps {
  label: string
  value: number
}

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '10px',
        padding: '14px',
      }}
    >
      <span
        className="font-mono text-[9px] uppercase tracking-[0.1em] block"
        style={{ color: 'var(--text-secondary)', marginBottom: '6px' }}
      >
        {label}
      </span>
      <span
        className="font-mono text-2xl"
        style={{ color: 'var(--text-display)' }}
      >
        {value}
      </span>
    </div>
  )
}

interface LeadsMetricsProps {
  from: Date
  to: Date
}

export async function LeadsMetrics({ from, to }: LeadsMetricsProps) {
  const supabase = await createClient()

  const [totalResult, qualResult, captadosResult, igResult] = await Promise.all([
    // Total em pipeline (excluindo recusa)
    supabase
      .from('leads_qualified')
      .select('id', { count: 'exact', head: true })
      .neq('etapa', 'recusa')
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString()),

    // Qualificados (score A ou B)
    supabase
      .from('leads_qualified')
      .select('id', { count: 'exact', head: true })
      .in('score', ['A', 'B'])
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString()),

    // Total captados no período
    supabase
      .from('leads_qualified')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString()),

    // Vindos do Instagram
    supabase
      .from('leads_qualified')
      .select('id', { count: 'exact', head: true })
      .in('origem', ['instagram_comentario', 'instagram_seguidor'])
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString()),
  ])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '180px', flexShrink: 0 }}>
      <span
        className="font-mono text-[9px] uppercase tracking-[0.1em]"
        style={{ color: 'var(--text-disabled)' }}
      >
        MÉTRICAS
      </span>
      <MetricCard label="Em pipeline" value={totalResult.count ?? 0} />
      <MetricCard label="Qualificados" value={qualResult.count ?? 0} />
      <MetricCard label="Captados" value={captadosResult.count ?? 0} />
      <MetricCard label="Do Instagram" value={igResult.count ?? 0} />
    </div>
  )
}
