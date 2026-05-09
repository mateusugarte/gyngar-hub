'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { loginAction, type LoginState } from './actions'

const initialState: LoginState = { error: null }

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState)

  return (
    <div
      style={{
        width: '400px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '40px',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div
          style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'var(--accent)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span className="font-sans font-medium text-sm" style={{ color: 'var(--bg-base)' }}>G</span>
        </div>
        <span className="font-sans font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
          Gyngar.hub
        </span>
      </div>

      <span
        className="font-mono text-[10px] uppercase tracking-[0.1em] block mb-6"
        style={{ color: 'var(--text-secondary)' }}
      >
        ENTRAR NA CONTA
      </span>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="email"
            className="font-mono text-[10px] uppercase tracking-[0.1em]"
            style={{ color: 'var(--text-secondary)' }}
          >
            EMAIL
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full px-3 py-2 rounded-lg text-sm font-sans outline-none"
            style={{
              background: 'var(--bg-base)',
              border: '1px solid var(--border-visible)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="password"
            className="font-mono text-[10px] uppercase tracking-[0.1em]"
            style={{ color: 'var(--text-secondary)' }}
          >
            SENHA
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full px-3 py-2 rounded-lg text-sm font-sans outline-none"
            style={{
              background: 'var(--bg-base)',
              border: '1px solid var(--border-visible)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {state.error && (
          <span className="font-mono text-[11px]" style={{ color: 'var(--danger)' }}>
            {state.error}
          </span>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full py-2 rounded-lg text-sm font-sans font-medium mt-2"
          style={{
            background: pending ? 'var(--border-visible)' : 'var(--accent)',
            color: pending ? 'var(--text-disabled)' : 'var(--bg-base)',
            border: 'none',
            cursor: pending ? 'not-allowed' : 'pointer',
            transition: 'background 150ms ease-out',
          }}
        >
          {pending ? '[ENTRANDO...]' : 'Entrar'}
        </button>
      </form>

      <p className="text-sm font-sans mt-6 text-center" style={{ color: 'var(--text-secondary)' }}>
        Sem conta?{' '}
        <Link href="/register" style={{ color: 'var(--accent-text)' }}>
          Criar conta
        </Link>
      </p>
    </div>
  )
}
