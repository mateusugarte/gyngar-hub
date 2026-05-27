'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface Page {
  pageId: string
  pageName: string
  igAccountId: string
  igUsername: string | null
}

interface PendingCookie {
  pages: Page[]
}

export function IgPageSelector() {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const LABEL = 'font-mono text-[9px] uppercase tracking-[0.08em]'

  useEffect(() => {
    // Lê as páginas do cookie via endpoint dedicado
    fetch('/api/instagram/pending-pages')
      .then(r => r.ok ? r.json() : null)
      .then((data: PendingCookie | null) => setPages(data?.pages ?? []))
      .catch(() => setPages([]))
      .finally(() => setLoading(false))
  }, [])

  async function handleSelect(igAccountId: string) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/instagram/select-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ igAccountId }),
      })
      const json = await res.json() as { ok?: boolean; display?: string; error?: string }
      if (!res.ok) {
        setError(json.error ?? 'Erro ao conectar')
      } else {
        router.push(`/settings?ig_success=1&ig_user=${encodeURIComponent(json.display ?? '')}`)
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
      }}>
        <Loader2 size={16} className="animate-spin" style={{ color: 'var(--text-secondary)' }} />
        <span className={LABEL} style={{ color: 'var(--text-secondary)' }}>Carregando contas...</span>
      </div>
    )
  }

  if (pages.length === 0) {
    return (
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--danger)',
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        gap: '10px',
        alignItems: 'flex-start',
      }}>
        <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '1px' }} />
        <div>
          <p className="font-sans text-sm" style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>
            Sessão expirada ou inválida
          </p>
          <p className="font-sans text-xs" style={{ color: 'var(--text-secondary)' }}>
            O tempo de seleção (10 min) expirou.{' '}
            <a href="/api/instagram/connect" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
              Clique aqui para conectar novamente.
            </a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--accent-border)',
      borderRadius: '12px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    }}>
      <div>
        <p className="font-sans text-sm font-medium" style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>
          Selecione a conta Instagram
        </p>
        <p className="font-sans text-xs" style={{ color: 'var(--text-secondary)' }}>
          Encontramos {pages.length} contas Instagram Business vinculadas ao seu Facebook. Escolha qual deseja conectar.
        </p>
      </div>

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 14px', background: 'var(--danger-subtle)',
          borderRadius: '8px', border: '1px solid var(--danger)',
        }}>
          <AlertCircle size={13} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          <span className="font-sans text-xs" style={{ color: 'var(--danger)' }}>{error}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {pages.map(page => (
          <button
            key={page.igAccountId}
            type="button"
            onClick={() => handleSelect(page.igAccountId)}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px 16px',
              background: 'var(--bg-surface-raised)',
              border: '1px solid var(--border-visible)',
              borderRadius: '10px',
              cursor: saving ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              transition: 'border-color 150ms ease-out, background 150ms ease-out',
              opacity: saving ? 0.6 : 1,
            }}
            className="card-hover"
          >
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'var(--accent-subtle)',
              border: '1px solid var(--accent-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Camera size={18} style={{ color: 'var(--accent-text)' }} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="font-sans text-sm font-medium" style={{ color: 'var(--text-primary)', marginBottom: '2px' }}>
                {page.igUsername ? `@${page.igUsername}` : `ID: ${page.igAccountId}`}
              </p>
              <p className={LABEL} style={{ color: 'var(--text-secondary)' }}>
                Página: {page.pageName}
              </p>
            </div>

            {saving
              ? <Loader2 size={15} className="animate-spin" style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
              : <CheckCircle size={15} style={{ color: 'var(--border-visible)', flexShrink: 0 }} />
            }
          </button>
        ))}
      </div>

      <p className="font-sans text-xs" style={{ color: 'var(--text-disabled)' }}>
        Não encontrou a conta certa?{' '}
        <a href="/api/instagram/connect" style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}>
          Reconectar com outra conta do Facebook
        </a>
      </p>
    </div>
  )
}
