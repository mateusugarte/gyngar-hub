interface ProgressBarProps {
  value: number
  max: number
  blocks?: number
  color?: string
}

export function ProgressBar({ value, max, blocks = 10, color = 'var(--accent)' }: ProgressBarProps) {
  const filled = max > 0 ? Math.round((Math.min(value, max) / max) * blocks) : 0

  return (
    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
      {Array.from({ length: blocks }).map((_, i) => (
        <div
          key={i}
          style={{
            width: '100%',
            height: '6px',
            background: i < filled ? color : 'var(--border-visible)',
            flex: 1,
          }}
        />
      ))}
      <span
        className="font-mono text-[10px] ml-2 whitespace-nowrap"
        style={{ color: 'var(--text-secondary)', flexShrink: 0 }}
      >
        {value}/{max}
      </span>
    </div>
  )
}
