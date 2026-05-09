'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

type Range = 'semana' | 'mes' | 'personalizado'

const OPTIONS: { value: Range; label: string }[] = [
  { value: 'semana', label: 'Esta semana' },
  { value: 'mes', label: 'Este mês' },
  { value: 'personalizado', label: 'Personalizado' },
]

export function getDateRange(range: Range, from?: string, to?: string): { from: Date; to: Date } {
  const now = new Date()
  if (range === 'semana') {
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    start.setHours(0, 0, 0, 0)
    return { from: start, to: now }
  }
  if (range === 'mes') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: start, to: now }
  }
  // personalizado
  return {
    from: from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1),
    to: to ? new Date(to) : now,
  }
}

interface DateRangeFilterProps {
  current?: Range
  from?: string
  to?: string
}

export function DateRangeFilter({ current = 'semana', from, to }: DateRangeFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function setRange(range: Range) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', range)
    if (range !== 'personalizado') {
      params.delete('from')
      params.delete('to')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  function setCustomDate(field: 'from' | 'to', value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', 'personalizado')
    params.set(field, value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: '2px' }}>
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setRange(opt.value)}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontFamily: 'Space Mono, monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              border: 'none',
              cursor: 'pointer',
              background: current === opt.value ? 'var(--accent-subtle)' : 'transparent',
              color: current === opt.value ? 'var(--accent-text)' : 'var(--text-secondary)',
              transition: 'background 150ms',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {current === 'personalizado' && (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <input
            type="date"
            value={from ?? ''}
            onChange={(e) => setCustomDate('from', e.target.value)}
            style={{
              padding: '4px 8px', borderRadius: '6px', fontSize: '12px',
              background: 'var(--bg-surface)', border: '1px solid var(--border-visible)',
              color: 'var(--text-primary)', fontFamily: 'Space Mono, monospace',
            }}
          />
          <span className="font-mono text-[10px]" style={{ color: 'var(--text-disabled)' }}>→</span>
          <input
            type="date"
            value={to ?? ''}
            onChange={(e) => setCustomDate('to', e.target.value)}
            style={{
              padding: '4px 8px', borderRadius: '6px', fontSize: '12px',
              background: 'var(--bg-surface)', border: '1px solid var(--border-visible)',
              color: 'var(--text-primary)', fontFamily: 'Space Mono, monospace',
            }}
          />
        </div>
      )}
    </div>
  )
}
