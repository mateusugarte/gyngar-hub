'use client'

import { useActionState } from 'react'
import { saveApifyKeyAction, type ActionState } from '../actions'

const initialState: ActionState = { error: null, success: false }

export function SettingsApify({ initialKey }: { initialKey: string }) {
  const [state, formAction, pending] = useActionState(saveApifyKeyAction, initialState)

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
        className="font-mono text-[10px] uppercase tracking-[0.1em] block mb-2"
        style={{ color: 'var(--text-secondary)' }}
      >
        APIFY
      </span>
      <p className="text-sm font-sans mb-4" style={{ color: 'var(--text-secondary)' }}>
        Chave de API do Apify para prospecção automática.
      </p>

      <form action={formAction} className="flex flex-col gap-3">
        <input
          name="apify_api_key"
          type="password"
          defaultValue={initialKey}
          placeholder="apify_api_..."
          className="px-3 py-2 rounded-lg text-sm font-mono w-full outline-none"
          style={{
            background: 'var(--bg-base)',
            border: '1px solid var(--border-visible)',
            color: 'var(--text-primary)',
          }}
        />

        {state.error && (
          <span className="font-mono text-[11px]" style={{ color: 'var(--danger)' }}>
            {state.error}
          </span>
        )}
        {state.success && (
          <span className="font-mono text-[11px]" style={{ color: 'var(--success)' }}>
            Chave salva com sucesso.
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
          {pending ? '[SALVANDO...]' : 'Salvar'}
        </button>
      </form>
    </section>
  )
}
