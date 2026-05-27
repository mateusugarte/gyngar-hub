'use client'

interface EngagementBarChartProps {
  data: { tipo: string; engajamento: number }[]
}

const TIPO_COLORS: Record<string, string> = {
  reel: 'var(--accent)',
  imagem: 'var(--warning)',
  carrossel: 'var(--success)',
  // legado
  isca: 'var(--accent)',
  educacao: 'var(--accent-text)',
  viralizacao: 'var(--warning)',
  bastidores: 'var(--success)',
  promocional: 'var(--text-secondary)',
}

export function EngagementBarChart({ data }: EngagementBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="font-mono text-[9px] uppercase" style={{ color: 'var(--text-disabled)' }}>
          [SEM DADOS]
        </span>
      </div>
    )
  }

  const max = Math.max(...data.map((d) => d.engajamento), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {data.map((item) => {
        const pct = (item.engajamento / max) * 100
        const color = TIPO_COLORS[item.tipo.toLowerCase()] ?? 'var(--text-secondary)'
        return (
          <div key={item.tipo} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              className="font-mono text-[9px] uppercase tracking-[0.08em]"
              style={{ width: '88px', flexShrink: 0, color: 'var(--text-secondary)' }}
            >
              {item.tipo}
            </span>
            <div style={{ flex: 1, height: '6px', background: 'var(--border-subtle)' }}>
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: color,
                  transition: 'width 600ms ease-out',
                }}
              />
            </div>
            <span
              className="font-mono text-[10px]"
              style={{ width: '40px', textAlign: 'right', flexShrink: 0, color: 'var(--text-primary)' }}
            >
              {item.engajamento.toFixed(1)}%
            </span>
          </div>
        )
      })}
    </div>
  )
}
