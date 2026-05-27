'use client'

import { useActionState, useState } from 'react'
import { saveGoalsAction, type ActionState, type GoalsData } from '../actions'

const initialState: ActionState = { error: null, success: false }
const LABEL = 'font-mono text-[9px] uppercase tracking-[0.08em]'

// ─── Stepper control ─────────────────────────────────────────────────────────

interface StepperProps {
  name: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  prefix?: string
}

function Stepper({ name, value, onChange, min = 0, max = 99999, step = 1, unit, prefix }: StepperProps) {
  function dec() { onChange(Math.max(min, value - step)) }
  function inc() { onChange(Math.min(max, value + step)) }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        style={{
          width: '32px', height: '36px', border: '1px solid var(--border-visible)',
          borderRight: 'none', borderRadius: '6px 0 0 6px', background: 'var(--bg-surface-raised)',
          color: value <= min ? 'var(--text-disabled)' : 'var(--text-secondary)',
          cursor: value <= min ? 'not-allowed' : 'pointer', fontSize: '16px', lineHeight: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >−</button>
      <div style={{
        height: '36px', border: '1px solid var(--border-visible)', background: 'var(--bg-base)',
        display: 'flex', alignItems: 'center', padding: '0 8px', gap: '3px', minWidth: '72px', justifyContent: 'center',
      }}>
        {prefix && <span className="font-mono text-xs" style={{ color: 'var(--text-disabled)' }}>{prefix}</span>}
        <span className="font-mono text-sm" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          {value.toLocaleString('pt-BR')}
        </span>
        {unit && <span className="font-mono text-xs" style={{ color: 'var(--text-disabled)' }}>{unit}</span>}
      </div>
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        style={{
          width: '32px', height: '36px', border: '1px solid var(--border-visible)',
          borderLeft: 'none', borderRadius: '0 6px 6px 0', background: 'var(--bg-surface-raised)',
          color: value >= max ? 'var(--text-disabled)' : 'var(--text-secondary)',
          cursor: value >= max ? 'not-allowed' : 'pointer', fontSize: '16px', lineHeight: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >+</button>
      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={value} />
    </div>
  )
}

// ─── Goal row ─────────────────────────────────────────────────────────────────

interface GoalRowProps {
  label: string
  description: string
  children: React.ReactNode
}

function GoalRow({ label, description, children }: GoalRowProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '16px', padding: '12px 0',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div style={{ flex: 1 }}>
        <div className={LABEL} style={{ color: 'var(--text-primary)', marginBottom: '2px' }}>{label}</div>
        <div className="font-sans text-xs" style={{ color: 'var(--text-disabled)' }}>{description}</div>
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}

// ─── Group ────────────────────────────────────────────────────────────────────

function GoalGroup({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--bg-surface-raised)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '8px',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'var(--bg-base)',
      }}>
        <span style={{ width: '3px', height: '14px', borderRadius: '2px', background: color, display: 'inline-block' }} />
        <span className={LABEL} style={{ color: 'var(--text-secondary)' }}>{title}</span>
      </div>
      <div style={{ padding: '0 14px' }}>
        {children}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface SettingsGoalsProps {
  goals: Partial<GoalsData> | null
}

export function SettingsGoals({ goals }: SettingsGoalsProps) {
  const [state, formAction, pending] = useActionState(saveGoalsAction, initialState)

  // Vendas
  const [reunioes, setReunioes] = useState(goals?.reunioes_meta ?? 4)
  const [vendas, setVendas] = useState(goals?.vendas_meta ?? 2)
  const [taxaConversao, setTaxaConversao] = useState(goals?.taxa_conversao_meta ?? 30)
  const [faturamento, setFaturamento] = useState(goals?.faturamento_meta ?? 0)

  // Prospecção
  const [prospeccoes, setProspeccoes] = useState(goals?.prospeccoes_diarias_meta ?? 10)

  // Conteúdo & Crescimento
  const [postsSemana, setPostsSemana] = useState(goals?.posts_semana_meta ?? 3)
  const [seguidores, setSeguidores] = useState(goals?.seguidores_meta ?? 1000)

  return (
    <section style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '12px',
      padding: '24px',
    }}>
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] block mb-1" style={{ color: 'var(--text-secondary)' }}>
        METAS
      </span>
      <p className="text-sm font-sans mb-5" style={{ color: 'var(--text-secondary)' }}>
        Define os números que o dashboard usa para calcular progresso e alertas.
      </p>

      <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* VENDAS */}
        <GoalGroup title="VENDAS" color="var(--success)">
          <GoalRow label="REUNIÕES POR SEMANA" description="Quantas reuniões comerciais você quer realizar">
            <Stepper name="reunioes_meta" value={reunioes} onChange={setReunioes} unit="/sem" max={50} />
          </GoalRow>
          <GoalRow label="VENDAS POR MÊS" description="Número de contratos fechados mensalmente">
            <Stepper name="vendas_meta" value={vendas} onChange={setVendas} unit="/mês" max={200} />
          </GoalRow>
          <GoalRow label="TAXA DE CONVERSÃO" description="% de reuniões que viram venda">
            <Stepper name="taxa_conversao_meta" value={taxaConversao} onChange={setTaxaConversao} unit="%" max={100} />
          </GoalRow>
          <GoalRow label="FATURAMENTO MENSAL" description="Meta de receita (usado no dashboard)">
            <Stepper name="faturamento_meta" value={faturamento} onChange={setFaturamento} prefix="R$" step={500} max={999999} />
          </GoalRow>
        </GoalGroup>

        {/* PROSPECÇÃO */}
        <GoalGroup title="PROSPECÇÃO" color="var(--accent)">
          <GoalRow label="LEADS POR DIA" description="Novos contatos qualificados por dia de prospecção">
            <Stepper name="prospeccoes_diarias_meta" value={prospeccoes} onChange={setProspeccoes} unit="/dia" max={200} />
          </GoalRow>
        </GoalGroup>

        {/* CONTEÚDO & CRESCIMENTO */}
        <GoalGroup title="CONTEÚDO & CRESCIMENTO" color="var(--warning)">
          <GoalRow label="POSTS POR SEMANA" description="Frequência de publicação no Instagram">
            <Stepper name="posts_semana_meta" value={postsSemana} onChange={setPostsSemana} unit="/sem" max={14} />
          </GoalRow>
          <GoalRow label="META DE SEGUIDORES" description="Total de seguidores no Instagram">
            <Stepper name="seguidores_meta" value={seguidores} onChange={setSeguidores} step={100} max={999999} />
          </GoalRow>
        </GoalGroup>

        {/* Feedback + Submit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
          <button
            type="submit"
            disabled={pending}
            style={{
              padding: '8px 20px',
              background: pending ? 'var(--border-visible)' : 'var(--accent)',
              color: pending ? 'var(--text-disabled)' : 'var(--bg-base)',
              border: 'none', borderRadius: '7px',
              cursor: pending ? 'not-allowed' : 'pointer',
            }}
          >
            <span className={LABEL}>{pending ? 'SALVANDO...' : 'SALVAR METAS'}</span>
          </button>

          {state.error && (
            <span className={LABEL} style={{ color: 'var(--danger)' }}>{state.error}</span>
          )}
          {state.success && (
            <span className={LABEL} style={{ color: 'var(--success)' }}>✓ METAS SALVAS</span>
          )}
        </div>
      </form>
    </section>
  )
}
