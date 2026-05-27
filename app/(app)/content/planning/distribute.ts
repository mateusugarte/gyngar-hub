// Pure algorithm — no 'use client', safe to import from Server Components

export const PILAR_ORDER = ['educacional', 'bastidores', 'prova_social', 'engajamento', 'promocional'] as const
export type Pilar = (typeof PILAR_ORDER)[number]

export const PILAR_PCT: Record<Pilar, number> = {
  educacional: 0.40,
  bastidores:  0.20,
  prova_social: 0.15,
  engajamento: 0.15,
  promocional: 0.10,
}

export const PILAR_LABEL: Record<Pilar, string> = {
  educacional:  'Educacional',
  bastidores:   'Bastidores',
  prova_social: 'Prova Social',
  engajamento:  'Engajamento',
  promocional:  'Promocional',
}

export interface PilarConfig {
  pilar: Pilar
  count: number
  tipo: 'reels' | 'carrossel' | 'story'
}

export interface PlannedSlot {
  date: string      // YYYY-MM-DD
  pilar: Pilar
  tipo: 'reels' | 'carrossel' | 'story'
  idea_id?: string
  titulo?: string
}

/** Suggest counts per pilar based on total */
export function suggestDistribution(total: number): PilarConfig[] {
  const raw = PILAR_ORDER.map(pilar => ({
    pilar,
    count: Math.floor(total * PILAR_PCT[pilar]),
    tipo: (pilar === 'educacional' || pilar === 'prova_social' ? 'carrossel' : 'reels') as PilarConfig['tipo'],
  }))

  // Distribute remainder to highest-percentage pilares
  const assigned = raw.reduce((sum, p) => sum + p.count, 0)
  let remainder = total - assigned
  for (let i = 0; remainder > 0; i = (i + 1) % raw.length) {
    raw[i].count++
    remainder--
  }
  return raw
}

/** Distribute slots across the month.
 *  Rules:
 *  1. Spread posts evenly (gap = daysInMonth / total)
 *  2. Promotional never on 2 consecutive days
 *  3. Shuffle pilar order with spacing
 */
export function distributeAcrossMonth(
  year: number,
  month: number,  // 0-indexed
  config: PilarConfig[]
): PlannedSlot[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const total = config.reduce((s, c) => s + c.count, 0)
  if (total === 0) return []

  // Build ordered list of {pilar, tipo} expanding counts
  // Interleave pilares to spread them evenly
  const expanded: { pilar: Pilar; tipo: PilarConfig['tipo'] }[] = []
  const maxCount = Math.max(...config.map(c => c.count))
  for (let round = 0; round < maxCount; round++) {
    for (const cfg of config) {
      if (round < cfg.count) expanded.push({ pilar: cfg.pilar, tipo: cfg.tipo })
    }
  }

  // Assign dates with even spacing
  const gap = daysInMonth / total
  const slots: PlannedSlot[] = []
  let lastPromoDay = -99

  for (let i = 0; i < expanded.length; i++) {
    const { pilar, tipo } = expanded[i]
    let day = Math.round(1 + i * gap)
    if (day > daysInMonth) day = daysInMonth

    // Avoid same day as previous
    if (slots.length > 0) {
      const prevDay = parseInt(slots[slots.length - 1].date.split('-')[2])
      if (day <= prevDay) day = prevDay + 1
      if (day > daysInMonth) day = daysInMonth
    }

    // Promotional: never consecutive
    if (pilar === 'promocional' && day === lastPromoDay + 1) {
      day++
      if (day > daysInMonth) day = daysInMonth - 2
      if (day < 1) day = 1
    }

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    slots.push({ date: dateStr, pilar, tipo })

    if (pilar === 'promocional') lastPromoDay = day
  }

  return slots
}
