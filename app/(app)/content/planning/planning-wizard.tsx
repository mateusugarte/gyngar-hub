'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { MarketingAgentDrawer } from '@/app/(app)/agent/components/marketing-agent-drawer'
import {
  suggestDistribution,
  distributeAcrossMonth,
  PILAR_ORDER,
  PILAR_LABEL,
  type Pilar,
  type PilarConfig,
  type PlannedSlot,
} from './distribute'
import { saveMonthlyPlan } from '../actions'

interface AvailableIdea {
  id: string
  titulo: string
  tipo: string | null
  pilar: string | null
  status: string
}

interface PlanningWizardProps {
  defaultYear: number
  defaultMonth: number
  availableIdeas: AvailableIdea[]
}

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const PILAR_COLOR: Record<Pilar, string> = {
  educacional:  'var(--accent)',
  bastidores:   'var(--warning)',
  prova_social: 'var(--success)',
  engajamento:  '#a78bfa',
  promocional:  'var(--danger)',
}

const STEPS = ['Configurar', 'Distribuição', 'Calendário', 'Confirmar']

export function PlanningWizard({ defaultYear, defaultMonth, availableIdeas }: PlanningWizardProps) {
  const router = useRouter()

  // Step 1
  const [year, setYear] = useState(defaultYear)
  const [month, setMonth] = useState(defaultMonth)
  const [total, setTotal] = useState(12)

  // Step 2 — pilar config
  const [pilarConfig, setPilarConfig] = useState<PilarConfig[]>(() => suggestDistribution(12))

  // Step 3 — slots with optional idea assignment
  const [slots, setSlots] = useState<PlannedSlot[]>([])
  const [assigningSlot, setAssigningSlot] = useState<number | null>(null)

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agentOpen, setAgentOpen] = useState(false)

  const totalAssigned = pilarConfig.reduce((s, c) => s + c.count, 0)
  const totalMismatch = totalAssigned !== total

  function handleTotalChange(n: number) {
    setTotal(n)
    setPilarConfig(suggestDistribution(n))
  }

  function updatePilarCount(pilar: Pilar, count: number) {
    setPilarConfig(cfg => cfg.map(c => c.pilar === pilar ? { ...c, count: Math.max(0, count) } : c))
  }

  function updatePilarTipo(pilar: Pilar, tipo: PilarConfig['tipo']) {
    setPilarConfig(cfg => cfg.map(c => c.pilar === pilar ? { ...c, tipo } : c))
  }

  function goToStep3() {
    const generated = distributeAcrossMonth(year, month, pilarConfig)
    setSlots(generated)
    setStep(2)
  }

  function assignIdea(slotIdx: number, idea: AvailableIdea | null) {
    setSlots(prev => prev.map((s, i) => i === slotIdx ? { ...s, idea_id: idea?.id, titulo: idea?.titulo } : s))
    setAssigningSlot(null)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const res = await saveMonthlyPlan(slots)
    if (res.error) { setError(res.error); setSaving(false); return }
    router.push('/content/calendar')
  }

  // Pre-group ideas by pilar for quicker assignment
  const ideasByPilar = useMemo(() => {
    const map: Record<string, AvailableIdea[]> = {}
    for (const idea of availableIdeas) {
      const key = idea.pilar ?? 'sem_pilar'
      if (!map[key]) map[key] = []
      map[key].push(idea)
    }
    return map
  }, [availableIdeas])

  const LABEL = 'font-mono text-[9px] uppercase tracking-[0.08em]'
  const INPUT_STYLE = {
    background: 'var(--bg-surface-raised)',
    border: '1px solid var(--border-visible)',
    borderRadius: '6px',
    padding: '7px 10px',
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
    fontSize: '13px',
    outline: 'none',
  }

  return (
    <div style={{ padding: '32px', maxWidth: '760px', margin: '0 auto' }}>
      <MarketingAgentDrawer
        open={agentOpen}
        onClose={() => setAgentOpen(false)}
        mode="planejamento"
        title="PLANEJAR COM IA"
      />

      {/* Progress */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--text-secondary)' }}>PLANEJAMENTO MENSAL</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setAgentOpen(true)}
              className="font-mono text-[9px] uppercase tracking-[0.08em]"
              style={{
                padding: '5px 10px',
                background: 'var(--accent-subtle)',
                border: '1px solid var(--accent-border)',
                borderRadius: '6px',
                color: 'var(--accent-text)',
                cursor: 'pointer',
              }}
            >
              🤖 Planejar com IA
            </button>
            <span className="font-mono text-[10px]" style={{ color: 'var(--text-secondary)' }}>{step + 1}/{STEPS.length}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= step ? 'var(--accent)' : 'var(--border-visible)', transition: 'background 300ms' }} />
          ))}
        </div>
        <span className="font-sans text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{STEPS[step]}</span>
      </div>

      {/* ── STEP 1 ── Configurar */}
      {step === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>MÊS</label>
              <select value={month} onChange={e => setMonth(parseInt(e.target.value))} style={{ ...INPUT_STYLE, width: '100%', cursor: 'pointer' }}>
                {MONTH_NAMES.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>ANO</label>
              <select value={year} onChange={e => setYear(parseInt(e.target.value))} style={{ ...INPUT_STYLE, width: '100%', cursor: 'pointer' }}>
                {[defaultYear, defaultYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              TOTAL DE POSTS — {total}
            </label>
            <input
              type="range"
              min={4}
              max={30}
              value={total}
              onChange={e => handleTotalChange(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className={LABEL} style={{ color: 'var(--text-disabled)' }}>4</span>
              <span className={LABEL} style={{ color: 'var(--text-disabled)' }}>30</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface-raised)', borderRadius: '8px', padding: '14px', border: '1px solid var(--border-subtle)' }}>
            <span className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '10px' }}>PRÉVIA DA DISTRIBUIÇÃO</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {suggestDistribution(total).map(cfg => (
                <div key={cfg.pilar} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={LABEL} style={{ width: '100px', flexShrink: 0, color: PILAR_COLOR[cfg.pilar] }}>{PILAR_LABEL[cfg.pilar]}</span>
                  <div style={{ flex: 1, height: '5px', background: 'var(--border-subtle)', borderRadius: '2px' }}>
                    <div style={{ width: `${(cfg.count / total) * 100}%`, height: '100%', background: PILAR_COLOR[cfg.pilar], borderRadius: '2px' }} />
                  </div>
                  <span className="font-mono text-[11px]" style={{ color: 'var(--text-secondary)', width: '24px', textAlign: 'right' }}>{cfg.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2 ── Distribuição */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p className="font-sans text-xs" style={{ color: 'var(--text-secondary)' }}>
            Ajuste a quantidade por pilar. A distribuição sugerida segue o mix 40/20/15/15/10%.
          </p>

          {totalMismatch && (
            <div style={{ background: 'var(--warning-subtle)', border: '1px solid var(--warning)', borderRadius: '6px', padding: '8px 12px' }}>
              <span className={LABEL} style={{ color: 'var(--warning)' }}>TOTAL: {totalAssigned} (esperado: {total}) — ajuste os valores</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pilarConfig.map(cfg => (
              <div
                key={cfg.pilar}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 80px 1fr 80px',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: 'var(--bg-surface-raised)',
                  border: '1px solid var(--border-subtle)',
                  borderLeft: `3px solid ${PILAR_COLOR[cfg.pilar]}`,
                  borderRadius: '6px',
                }}
              >
                <span className={LABEL} style={{ color: PILAR_COLOR[cfg.pilar] }}>{PILAR_LABEL[cfg.pilar]}</span>
                <input
                  type="number"
                  min={0}
                  max={total}
                  value={cfg.count}
                  onChange={e => updatePilarCount(cfg.pilar, parseInt(e.target.value) || 0)}
                  style={{ ...INPUT_STYLE, textAlign: 'center', padding: '5px' }}
                />
                <input
                  type="range"
                  min={0}
                  max={total}
                  value={cfg.count}
                  onChange={e => updatePilarCount(cfg.pilar, parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: PILAR_COLOR[cfg.pilar] }}
                />
                <select
                  value={cfg.tipo}
                  onChange={e => updatePilarTipo(cfg.pilar, e.target.value as PilarConfig['tipo'])}
                  style={{ ...INPUT_STYLE, padding: '5px', fontSize: '11px', cursor: 'pointer' }}
                >
                  <option value="reels">Reels</option>
                  <option value="carrossel">Carrossel</option>
                  <option value="story">Story</option>
                </select>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <span className={LABEL} style={{ color: totalMismatch ? 'var(--warning)' : 'var(--success)' }}>
              TOTAL: {totalAssigned}/{total}
            </span>
          </div>
        </div>
      )}

      {/* ── STEP 3 ── Calendário */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p className="font-sans text-xs" style={{ color: 'var(--text-secondary)' }}>
            {slots.length} posts distribuídos em {MONTH_NAMES[month]}. Clique em um slot para atribuir uma ideia existente, ou deixe em branco para criar depois.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '420px', overflowY: 'auto' }}>
            {slots.map((slot, idx) => {
              const suggestedIdeas = ideasByPilar[slot.pilar] ?? []
              return (
                <div key={idx}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '90px 110px 1fr auto',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      background: 'var(--bg-surface-raised)',
                      border: assigningSlot === idx ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                      borderLeft: `3px solid ${PILAR_COLOR[slot.pilar]}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setAssigningSlot(assigningSlot === idx ? null : idx)}
                  >
                    <span className="font-mono text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                      {slot.date.split('-').slice(1).reverse().join('/')}
                    </span>
                    <span className={LABEL} style={{ color: PILAR_COLOR[slot.pilar] }}>{PILAR_LABEL[slot.pilar]}</span>
                    <span className="font-sans text-xs" style={{ color: slot.idea_id ? 'var(--text-primary)' : 'var(--text-disabled)', fontStyle: slot.idea_id ? 'normal' : 'italic' }}>
                      {slot.titulo ?? '— sem ideia atribuída —'}
                    </span>
                    <span className={LABEL} style={{ color: 'var(--text-disabled)' }}>{slot.tipo}</span>
                  </div>

                  {assigningSlot === idx && (
                    <div style={{ marginTop: '4px', padding: '10px', background: 'var(--bg-surface)', border: '1px solid var(--accent)', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => assignIdea(idx, null)}
                        className="font-sans text-xs"
                        style={{ padding: '6px 10px', textAlign: 'left', background: 'transparent', border: '1px dashed var(--border-visible)', borderRadius: '4px', color: 'var(--text-secondary)', cursor: 'pointer' }}
                      >
                        Criar depois (slot vazio)
                      </button>
                      {suggestedIdeas.length > 0 && (
                        <>
                          <span className={LABEL} style={{ color: 'var(--text-disabled)', padding: '4px 0 2px' }}>IDEIAS DO MESMO PILAR</span>
                          {suggestedIdeas.map(idea => (
                            <button
                              key={idea.id}
                              type="button"
                              onClick={() => assignIdea(idx, idea)}
                              className="font-sans text-xs"
                              style={{
                                padding: '6px 10px',
                                textAlign: 'left',
                                background: slot.idea_id === idea.id ? 'var(--accent)' : 'var(--bg-surface-raised)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '4px',
                                color: slot.idea_id === idea.id ? 'var(--bg-base)' : 'var(--text-primary)',
                                cursor: 'pointer',
                              }}
                            >
                              {idea.titulo}
                            </button>
                          ))}
                        </>
                      )}
                      {availableIdeas.filter(i => i.pilar !== slot.pilar).length > 0 && (
                        <>
                          <span className={LABEL} style={{ color: 'var(--text-disabled)', padding: '4px 0 2px' }}>OUTRAS IDEIAS</span>
                          {availableIdeas.filter(i => i.pilar !== slot.pilar).slice(0, 5).map(idea => (
                            <button
                              key={idea.id}
                              type="button"
                              onClick={() => assignIdea(idx, idea)}
                              className="font-sans text-xs"
                              style={{
                                padding: '6px 10px',
                                textAlign: 'left',
                                background: slot.idea_id === idea.id ? 'var(--accent)' : 'var(--bg-surface-raised)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '4px',
                                color: slot.idea_id === idea.id ? 'var(--bg-base)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                              }}
                            >
                              {idea.titulo}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Pilar legend */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', paddingTop: '4px' }}>
            {PILAR_ORDER.map(p => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: PILAR_COLOR[p] }} />
                <span className={LABEL} style={{ color: 'var(--text-secondary)' }}>{PILAR_LABEL[p]} ({pilarConfig.find(c => c.pilar === p)?.count ?? 0})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 4 ── Confirmar */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'var(--bg-surface-raised)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span className={LABEL} style={{ color: 'var(--text-secondary)' }}>RESUMO DO PLANEJAMENTO</span>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div>
                <span className={LABEL} style={{ color: 'var(--text-disabled)', display: 'block', marginBottom: '2px' }}>PERÍODO</span>
                <span className="font-sans text-sm" style={{ color: 'var(--text-primary)' }}>{MONTH_NAMES[month]} {year}</span>
              </div>
              <div>
                <span className={LABEL} style={{ color: 'var(--text-disabled)', display: 'block', marginBottom: '2px' }}>TOTAL POSTS</span>
                <span className="font-sans text-sm" style={{ color: 'var(--text-primary)' }}>{slots.length}</span>
              </div>
              <div>
                <span className={LABEL} style={{ color: 'var(--text-disabled)', display: 'block', marginBottom: '2px' }}>IDEIAS ATRIBUÍDAS</span>
                <span className="font-sans text-sm" style={{ color: 'var(--success)' }}>
                  {slots.filter(s => s.idea_id).length}/{slots.length}
                </span>
              </div>
              <div>
                <span className={LABEL} style={{ color: 'var(--text-disabled)', display: 'block', marginBottom: '2px' }}>STUBS A CRIAR</span>
                <span className="font-sans text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {slots.filter(s => !s.idea_id).length}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {pilarConfig.filter(c => c.count > 0).map(cfg => (
                <div key={cfg.pilar} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '1px', background: PILAR_COLOR[cfg.pilar], flexShrink: 0 }} />
                  <span className={LABEL} style={{ color: PILAR_COLOR[cfg.pilar], width: '100px' }}>{PILAR_LABEL[cfg.pilar]}</span>
                  <span className="font-mono text-[11px]" style={{ color: 'var(--text-secondary)' }}>{cfg.count} posts · {cfg.tipo}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="font-sans text-xs" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Slots sem ideia atribuída serão criados como rascunhos no banco de ideias para você preencher depois. Posts serão visíveis no Calendário imediatamente após salvar.
          </p>

          {error && <span className="font-mono text-[10px]" style={{ color: 'var(--danger)' }}>{error}</span>}
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
        <button
          type="button"
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
          className={LABEL}
          style={{
            padding: '8px 18px',
            background: 'transparent',
            border: '1px solid var(--border-visible)',
            borderRadius: '6px',
            color: step === 0 ? 'var(--text-disabled)' : 'var(--text-secondary)',
            cursor: step === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          ← Anterior
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            disabled={step === 1 && totalMismatch}
            onClick={() => {
              if (step === 1) goToStep3()
              else setStep(s => s + 1)
            }}
            className={LABEL}
            style={{
              padding: '8px 18px',
              background: step === 1 && totalMismatch ? 'var(--border-visible)' : 'var(--accent)',
              border: 'none',
              borderRadius: '6px',
              color: step === 1 && totalMismatch ? 'var(--text-disabled)' : 'var(--bg-base)',
              cursor: step === 1 && totalMismatch ? 'not-allowed' : 'pointer',
            }}
          >
            {step === 2 ? 'Revisar →' : 'Próximo →'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={LABEL}
            style={{
              padding: '8px 18px',
              background: saving ? 'var(--border-visible)' : 'var(--success)',
              border: 'none',
              borderRadius: '6px',
              color: saving ? 'var(--text-disabled)' : 'var(--bg-base)',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Salvando...' : 'Salvar Planejamento'}
          </button>
        )}
      </div>
    </div>
  )
}
