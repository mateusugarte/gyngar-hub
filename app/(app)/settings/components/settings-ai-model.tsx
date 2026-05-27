'use client'

import { useActionState } from 'react'
import { saveAiModelAction, type ActionState, type AiModel } from '../actions'

const initialState: ActionState = { error: null, success: false }

const MODELS: { id: AiModel; label: string; desc: string }[] = [
  { id: 'gpt-4o',       label: 'GPT-4o',       desc: 'Padrão — balanceia qualidade e velocidade' },
  { id: 'gpt-4o-mini',  label: 'GPT-4o mini',  desc: 'Econômico — respostas mais rápidas e baratas' },
  { id: 'gpt-4.1',      label: 'GPT-4.1',      desc: 'Avançado — máxima qualidade de raciocínio' },
  { id: 'gpt-4.1-mini', label: 'GPT-4.1 mini', desc: 'Avançado econômico — GPT-4.1 com menor custo' },
]

export function SettingsAiModel({ currentModel }: { currentModel: AiModel }) {
  const [state, formAction, pending] = useActionState(saveAiModelAction, initialState)

  return (
    <section
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '24px',
      }}
    >
      <span
        className="font-mono text-[10px] uppercase tracking-[0.1em] block mb-1"
        style={{ color: 'var(--text-secondary)' }}
      >
        MODELO DE IA
      </span>
      <p className="text-sm font-sans mb-4" style={{ color: 'var(--text-secondary)' }}>
        Modelo OpenAI usado pelo agente de marketing, planejamento e avaliação de posts.
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {MODELS.map((m) => {
            const isSelected = currentModel === m.id
            return (
              <label
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                  background: isSelected ? 'color-mix(in srgb, var(--accent) 8%, var(--bg-surface-raised))' : 'var(--bg-surface-raised)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease-out',
                }}
              >
                <input
                  type="radio"
                  name="ai_model"
                  value={m.id}
                  defaultChecked={isSelected}
                  style={{ marginTop: '2px', accentColor: 'var(--accent)', flexShrink: 0 }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: 'var(--text-primary)' }}>
                    {m.label}
                  </span>
                  <span className="font-sans text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {m.desc}
                  </span>
                </div>
              </label>
            )
          })}
        </div>

        {state.error && (
          <span className="font-mono text-[11px]" style={{ color: 'var(--danger)' }}>
            {state.error}
          </span>
        )}
        {state.success && (
          <span className="font-mono text-[11px]" style={{ color: 'var(--success)' }}>
            Modelo atualizado com sucesso.
          </span>
        )}

        <button
          type="submit"
          disabled={pending}
          className="self-start px-4 py-2 rounded-lg text-sm font-sans font-medium"
          style={{
            background: pending ? 'var(--border-visible)' : 'var(--accent)',
            color: pending ? 'var(--text-disabled)' : 'var(--bg-base)',
            border: 'none',
            cursor: pending ? 'not-allowed' : 'pointer',
            transition: 'background 150ms ease-out',
          }}
        >
          {pending ? '[SALVANDO...]' : 'Salvar modelo'}
        </button>
      </form>
    </section>
  )
}
