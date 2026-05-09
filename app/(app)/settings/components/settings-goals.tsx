'use client'

import { useActionState } from 'react'
import { saveGoalsAction, type ActionState } from '../actions'

interface Goals {
  reunioes_meta: number
  vendas_meta: number
  prospeccoes_diarias_meta: number
}

const initialState: ActionState = { error: null, success: false }

const FIELDS = [
  { name: 'reunioes_meta',            label: 'REUNIÕES POR SEMANA'  },
  { name: 'vendas_meta',              label: 'VENDAS POR MÊS'       },
  { name: 'prospeccoes_diarias_meta', label: 'PROSPECÇÕES POR DIA'  },
] as const

export function SettingsGoals({ goals }: { goals: Goals | null }) {
  const [state, formAction, pending] = useActionState(saveGoalsAction, initialState)

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
        className="font-mono text-[10px] uppercase tracking-[0.1em] block mb-4"
        style={{ color: 'var(--text-secondary)' }}
      >
        METAS
      </span>

      <form action={formAction} className="flex flex-col gap-4">
        {FIELDS.map(({ name, label }) => (
          <div key={name} className="flex flex-col gap-1">
            <label
              htmlFor={name}
              className="font-mono text-[10px] uppercase tracking-[0.1em]"
              style={{ color: 'var(--text-secondary)' }}
            >
              {label}
            </label>
            <input
              id={name}
              name={name}
              type="number"
              min="0"
              defaultValue={goals?.[name] ?? 0}
              className="px-3 py-2 rounded-lg text-sm font-mono w-32 outline-none"
              style={{
                background: 'var(--bg-base)',
                border: '1px solid var(--border-visible)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        ))}

        {state.error && (
          <span className="font-mono text-[11px]" style={{ color: 'var(--danger)' }}>
            {state.error}
          </span>
        )}
        {state.success && (
          <span className="font-mono text-[11px]" style={{ color: 'var(--success)' }}>
            Metas salvas.
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
          {pending ? '[SALVANDO...]' : 'Salvar metas'}
        </button>
      </form>
    </section>
  )
}
