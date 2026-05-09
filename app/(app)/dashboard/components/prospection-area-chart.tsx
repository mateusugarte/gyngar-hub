'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface ProspectionAreaChartProps {
  data: { date: string; feitas: number; meta: number }[]
  meta: number
}

export function ProspectionAreaChart({ data, meta }: ProspectionAreaChartProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="font-mono text-[9px] uppercase" style={{ color: 'var(--text-disabled)' }}>
          [SEM DADOS]
        </span>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: -32, bottom: 0 }}>
        <defs>
          <linearGradient id="gradFeitas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 9, fontFamily: 'Space Mono', fill: 'var(--text-disabled)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 9, fontFamily: 'Space Mono', fill: 'var(--text-disabled)' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--bg-surface-raised)',
            border: '1px solid var(--border-visible)',
            borderRadius: '8px',
            fontFamily: 'Space Mono',
            fontSize: '11px',
            color: 'var(--text-primary)',
          }}
          cursor={{ stroke: 'var(--border-visible)' }}
        />
        <ReferenceLine y={meta} stroke="var(--warning)" strokeDasharray="4 2" strokeWidth={1} />
        <Area
          type="monotone"
          dataKey="feitas"
          stroke="var(--accent)"
          strokeWidth={2}
          fill="url(#gradFeitas)"
          dot={false}
          name="Prospecções"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
