interface MetricCardProps {
  label: string
  value: string | number
  sub?: string
  delta?: number        // percentual vs período anterior (positivo = bom, negativo = ruim)
  deltaInvert?: boolean // se true: negativo é bom (ex: desqualificados)
  accent?: boolean      // destaque laranja
  children?: React.ReactNode
}

export function MetricCard({ label, value, sub, delta, deltaInvert = false, accent = false, children }: MetricCardProps) {
  const isPositive = deltaInvert ? (delta !== undefined && delta < 0) : (delta !== undefined && delta > 0)
  const isNegative = deltaInvert ? (delta !== undefined && delta > 0) : (delta !== undefined && delta < 0)

  return (
    <div
      style={{
        background: accent ? 'var(--accent-subtle)' : 'var(--bg-surface)',
        border: accent ? '1px solid var(--accent-border)' : '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <span
        className="font-mono text-[9px] uppercase tracking-[0.1em]"
        style={{ color: accent ? 'var(--accent-text)' : 'var(--text-secondary)' }}
      >
        {label}
      </span>

      <span
        className="font-mono tracking-[-0.02em]"
        style={{
          fontSize: '32px',
          lineHeight: 1,
          color: accent ? 'var(--accent-text)' : 'var(--text-display)',
        }}
      >
        {value}
      </span>

      {delta !== undefined && (
        <span
          className="font-mono text-[10px]"
          style={{
            color: isPositive ? 'var(--success)' : isNegative ? 'var(--danger)' : 'var(--text-disabled)',
          }}
        >
          {isPositive ? '↑' : isNegative ? '↓' : '→'} {Math.abs(delta)}% vs período anterior
        </span>
      )}

      {sub && (
        <span className="font-sans text-xs" style={{ color: 'var(--text-secondary)' }}>
          {sub}
        </span>
      )}

      {children}
    </div>
  )
}
