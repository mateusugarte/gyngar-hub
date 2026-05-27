'use client'

import { useState } from 'react'
import Link from 'next/link'

interface ContentHeaderProps {
  marketingContext?: Record<string, unknown>
  hasIg: boolean
  alcance: number
  curtidas: number
  comentarios: number
  salvos: number
  engajamentoMedio: number
  postsFeitosMes: number
  postsPrevistosMes: number
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(Math.round(n))
}

export function ContentHeader({
  hasIg,
  alcance,
  curtidas,
  comentarios,
  salvos,
  engajamentoMedio,
  postsFeitosMes,
  postsPrevistosMes,
}: ContentHeaderProps) {
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)

  async function handleSync() {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const res = await fetch('/api/instagram/sync', { method: 'POST' })
      let json: Record<string, unknown> = {}
      try { json = await res.json() } catch { /* resposta não-JSON */ }
      if (res.ok) setSyncMsg(`${json.synced ?? 0} posts sincronizados`)
      else setSyncMsg((json.error as string) ?? `Erro ${res.status}`)
    } catch (err) {
      setSyncMsg(err instanceof Error ? err.message : 'Erro de rede')
    } finally {
      setSyncing(false)
    }
  }

  const LABEL = 'font-mono text-[9px] uppercase tracking-[0.08em]'

  const metrics = [
    { label: 'Alcance',        value: fmt(alcance) },
    { label: 'Curtidas',       value: fmt(curtidas) },
    { label: 'Comentários',    value: fmt(comentarios) },
    { label: 'Salvos',         value: fmt(salvos) },
    { label: 'Eng. Médio',     value: `${engajamentoMedio.toFixed(1)}%` },
    { label: 'Posts este mês', value: String(postsFeitosMes) },
    { label: 'Posts previstos', value: String(postsPrevistosMes) },
  ]

  return (
    <>
      <div style={{ padding: '24px 24px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--text-secondary)' }}>
            CONTEÚDO
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {hasIg ? (
              <button
                type="button"
                onClick={handleSync}
                disabled={syncing}
                className={LABEL}
                style={{
                  padding: '6px 12px',
                  background: 'transparent',
                  border: '1px solid var(--border-visible)',
                  borderRadius: '6px',
                  color: syncing ? 'var(--text-disabled)' : 'var(--text-secondary)',
                  cursor: syncing ? 'not-allowed' : 'pointer',
                }}
              >
                {syncing ? 'Sincronizando...' : 'Sincronizar Instagram'}
              </button>
            ) : (
              <Link href="/settings" className={LABEL} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--warning)', borderRadius: '6px', color: 'var(--warning)', textDecoration: 'none' }}>
                Conectar Instagram
              </Link>
            )}
            <Link
              href="/content/planning"
              className={LABEL}
              style={{
                padding: '6px 12px',
                background: 'var(--accent)',
                borderRadius: '6px',
                color: 'var(--bg-base)',
                textDecoration: 'none',
              }}
            >
              Criar Planejamento
            </Link>
          </div>
        </div>

        {syncMsg && (
          <span className={LABEL} style={{ color: 'var(--success)' }}>{syncMsg}</span>
        )}

        {!hasIg && (
          <div style={{
            background: 'var(--warning-subtle)',
            border: '1px solid var(--warning)',
            borderRadius: '8px',
            padding: '10px 14px',
          }}>
            <span className={LABEL} style={{ color: 'var(--warning)' }}>
              Instagram não conectado — métricas de conteúdo indisponíveis.{' '}
              <Link href="/settings" style={{ color: 'var(--warning)', textDecoration: 'underline' }}>Conectar agora</Link>
            </span>
          </div>
        )}

        {/* Metric strip */}
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
          {metrics.map(m => (
            <div key={m.label}>
              <span className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>{m.label}</span>
              <span className="font-mono text-[18px]" style={{ color: 'var(--text-primary)' }}>{m.value}</span>
            </div>
          ))}
        </div>

      </div>
    </>
  )
}
