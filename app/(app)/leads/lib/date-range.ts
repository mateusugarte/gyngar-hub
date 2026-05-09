type Range = 'semana' | 'mes' | 'personalizado'

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
  return {
    from: from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1),
    to: to ? new Date(to) : now,
  }
}
