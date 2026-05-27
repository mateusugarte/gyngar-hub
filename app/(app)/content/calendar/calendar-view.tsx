'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { scheduleIdea, removeFromCalendar } from '../actions'

interface Idea {
  id: string
  titulo: string
  tipo: string | null
  pilar: string | null
  status: string
}

interface CalendarEntry {
  id: string
  idea_id: string | null
  data_planejada: string
  status: string
  content_ideas?: Idea | null
}

interface CalendarViewProps {
  year: number
  month: number
  entries: CalendarEntry[]
  ideas: Idea[]
}

const STATUS_CHIP: Record<string, { bg: string; color: string; label: string }> = {
  ideia:     { bg: 'var(--accent-border)',  color: 'var(--accent-text)',  label: 'Ideia'     },
  producao:  { bg: 'var(--warning)',        color: 'var(--bg-base)',      label: 'Prod'      },
  agendado:  { bg: 'var(--accent)',         color: 'var(--bg-base)',      label: 'Agd'       },
  publicado: { bg: 'var(--success)',        color: 'var(--bg-base)',      label: 'Pub'       },
  cancelado: { bg: 'var(--border-visible)', color: 'var(--text-secondary)', label: 'Cancel' },
}

const TIPO_ICON: Record<string, string> = { reels: '▶', carrossel: '◼', story: '○' }
const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function CalendarView({ year, month, entries, ideas }: CalendarViewProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [addingToDay, setAddingToDay] = useState<number | null>(null)
  const [localEntries, setLocalEntries] = useState<CalendarEntry[]>(entries)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Group entries by day
  const byDay: Record<number, CalendarEntry[]> = {}
  for (const e of localEntries) {
    const day = parseInt(e.data_planejada.split('-')[2])
    if (!byDay[day]) byDay[day] = []
    byDay[day].push(e)
  }

  const selectedEntries = selectedDay ? (byDay[selectedDay] ?? []) : []

  function navigateMonth(delta: number) {
    let m = month + delta
    let y = year
    if (m < 0)  { m = 11; y-- }
    if (m > 11) { m = 0;  y++ }
    router.push(`/content/calendar?year=${y}&month=${m}`)
  }

  async function handleSchedule(ideaId: string) {
    if (!addingToDay) return
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(addingToDay).padStart(2, '0')}`

    // Optimistic update
    const idea = ideas.find(i => i.id === ideaId)
    const tempEntry: CalendarEntry = {
      id: `temp-${Date.now()}`,
      idea_id: ideaId,
      data_planejada: date,
      status: 'agendado',
      content_ideas: idea ?? null,
    }
    setLocalEntries(prev => [...prev, tempEntry])
    setAddingToDay(null)

    startTransition(async () => {
      const { error } = await scheduleIdea(ideaId, date)
      if (error) {
        // Rollback on error
        setLocalEntries(prev => prev.filter(e => e.id !== tempEntry.id))
      }
    })
  }

  async function handleRemove(entryId: string) {
    // Optimistic update
    setLocalEntries(prev => prev.filter(e => e.id !== entryId))
    if (selectedEntries.length === 1) setSelectedDay(null)

    startTransition(async () => {
      await removeFromCalendar(entryId)
    })
  }

  const LABEL = 'font-mono text-[9px] uppercase tracking-[0.08em]'

  return (
    <div style={{ padding: '24px', display: 'flex', gap: '20px' }}>
      {/* Calendar grid */}
      <div style={{ flex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--text-secondary)' }}>
            CALENDÁRIO
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => navigateMonth(-1)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-sans text-sm font-medium" style={{ color: 'var(--text-primary)', minWidth: '130px', textAlign: 'center' }}>
              {MONTH_NAMES[month]} {year}
            </span>
            <button
              onClick={() => navigateMonth(1)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '2px' }}>
          {DAY_NAMES.map(d => (
            <div key={d} className={LABEL} style={{ color: 'var(--text-disabled)', textAlign: 'center', padding: '6px 0' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
          {Array.from({ length: firstDow }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const dayEntries = byDay[day] ?? []
            const isSelected = selectedDay === day
            const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year
            return (
              <div
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                style={{
                  minHeight: '72px',
                  padding: '6px',
                  background: isSelected ? 'var(--bg-surface-raised)' : 'var(--bg-surface)',
                  border: isSelected ? '1px solid var(--accent)' : isToday ? '1px solid var(--border-visible)' : '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 150ms',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span
                    className="font-mono text-[11px]"
                    style={{
                      color: isToday ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: isToday ? 'bold' : 'normal',
                    }}
                  >
                    {day}
                  </span>
                  {dayEntries.length > 0 && (
                    <span className="font-mono text-[9px]" style={{ color: 'var(--text-disabled)' }}>
                      {dayEntries.length}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {dayEntries.slice(0, 2).map(e => {
                    const chip = STATUS_CHIP[e.status] ?? STATUS_CHIP.agendado
                    return (
                      <div
                        key={e.id}
                        style={{
                          fontSize: '9px',
                          padding: '2px 4px',
                          borderRadius: '3px',
                          background: chip.bg,
                          color: chip.color,
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          fontFamily: 'var(--font-space-mono, monospace)',
                        }}
                      >
                        {TIPO_ICON[e.content_ideas?.tipo ?? ''] ?? '·'} {e.content_ideas?.titulo ?? 'Post'}
                      </div>
                    )
                  })}
                  {dayEntries.length > 2 && (
                    <span className="font-mono text-[9px]" style={{ color: 'var(--text-disabled)' }}>
                      +{dayEntries.length - 2}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Side panel */}
      {selectedDay && (
        <div style={{
          width: '280px',
          flexShrink: 0,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          alignSelf: 'flex-start',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className={LABEL} style={{ color: 'var(--text-secondary)' }}>
              DIA {selectedDay} — {selectedEntries.length} POSTS
            </span>
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className={LABEL}
              style={{ background: 'none', border: 'none', color: 'var(--text-disabled)', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          {selectedEntries.length === 0 ? (
            <span className="font-sans text-xs" style={{ color: 'var(--text-disabled)' }}>Nenhum post neste dia.</span>
          ) : (
            selectedEntries.map(e => {
              const chip = STATUS_CHIP[e.status] ?? STATUS_CHIP.agendado
              return (
                <div
                  key={e.id}
                  style={{
                    padding: '10px',
                    background: 'var(--bg-surface-raised)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span
                          className={LABEL}
                          style={{
                            padding: '1px 5px', borderRadius: '3px',
                            background: chip.bg, color: chip.color,
                          }}
                        >
                          {chip.label}
                        </span>
                        {e.content_ideas?.tipo && (
                          <span className={LABEL} style={{ color: 'var(--text-disabled)' }}>
                            {e.content_ideas.tipo}
                          </span>
                        )}
                      </div>
                      <span className="font-sans text-xs" style={{ color: 'var(--text-primary)' }}>
                        {e.content_ideas?.titulo ?? 'Post sem título'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(e.id)}
                      disabled={isPending}
                      title="Remover do calendário"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '2px', borderRadius: '4px', flexShrink: 0,
                        opacity: isPending ? 0.5 : 1,
                      }}
                    >
                      <X size={12} style={{ color: 'var(--text-disabled)' }} />
                    </button>
                  </div>
                </div>
              )
            })
          )}

          {addingToDay === selectedDay ? (
            <div>
              <span className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                SELECIONAR IDEIA
              </span>
              {ideas.length === 0 ? (
                <span className="font-sans text-xs" style={{ color: 'var(--text-disabled)' }}>
                  Sem ideias disponíveis. Crie ideias no Banco de Ideias.
                </span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                  {ideas.map(idea => (
                    <button
                      key={idea.id}
                      type="button"
                      onClick={() => handleSchedule(idea.id)}
                      disabled={isPending}
                      className="font-sans text-xs"
                      style={{
                        padding: '8px',
                        textAlign: 'left',
                        background: 'var(--bg-surface-raised)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        opacity: isPending ? 0.5 : 1,
                      }}
                    >
                      {idea.titulo}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setAddingToDay(null)}
                className={LABEL}
                style={{ marginTop: '8px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingToDay(selectedDay)}
              className={LABEL}
              style={{
                padding: '8px',
                background: 'transparent',
                border: '1px dashed var(--border-visible)',
                borderRadius: '6px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              + Adicionar post neste dia
            </button>
          )}
        </div>
      )}
    </div>
  )
}
