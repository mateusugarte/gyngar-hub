'use client'

interface FunnelChartProps {
  impressoes: number
  leads: number
  reunioes: number
  vendas: number
}

function formatNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export function FunnelChart({ impressoes, leads, reunioes, vendas }: FunnelChartProps) {
  const max = Math.max(impressoes, 1)
  const steps = [
    { label: 'IMPRESSÕES', value: impressoes, color: 'var(--accent)' },
    { label: 'LEADS', value: leads, color: 'var(--accent-text)' },
    { label: 'REUNIÕES', value: reunioes, color: 'var(--warning)' },
    { label: 'VENDAS', value: vendas, color: 'var(--success)' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {steps.map((step) => {
        const pct = max > 0 ? (step.value / max) * 100 : 0
        return (
          <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              className="font-mono text-[9px] uppercase tracking-[0.08em]"
              style={{ width: '80px', flexShrink: 0, color: 'var(--text-secondary)' }}
            >
              {step.label}
            </span>
            <div
              style={{
                flex: 1,
                height: '8px',
                background: 'var(--border-subtle)',
                borderRadius: '0',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: step.color,
                  transition: 'width 600ms ease-out',
                }}
              />
            </div>
            <span
              className="font-mono text-[11px]"
              style={{ width: '48px', textAlign: 'right', flexShrink: 0, color: 'var(--text-primary)' }}
            >
              {formatNum(step.value)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
