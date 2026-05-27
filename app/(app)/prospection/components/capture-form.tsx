'use client'

import { useState } from 'react'

type Fonte = 'ig_comentarios' | 'ig_seguidores' | 'google_maps'

interface CaptureFormProps {
  onJobStarted: (jobId: string) => void
}

const FONTE_LABELS: Record<Fonte, string> = {
  ig_comentarios: 'Comentários IG',
  ig_seguidores: 'Seguidores IG',
  google_maps: 'Google Maps',
}

export function CaptureForm({ onJobStarted }: CaptureFormProps) {
  const [fonte, setFonte] = useState<Fonte>('ig_comentarios')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // IG Comments
  const [postUrls, setPostUrls] = useState('')
  const [maxComments, setMaxComments] = useState('200')

  // IG Followers
  const [username, setUsername] = useState('')
  const [maxFollowers, setMaxFollowers] = useState('500')

  // Google Maps
  const [searchTerms, setSearchTerms] = useState('')
  const [city, setCity] = useState('')
  const [maxResults, setMaxResults] = useState('100')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    let filtros: Record<string, unknown> = {}
    if (fonte === 'ig_comentarios') {
      filtros = {
        postUrls: postUrls.split('\n').map(u => u.trim()).filter(Boolean),
        maxComments: parseInt(maxComments) || 200,
      }
    } else if (fonte === 'ig_seguidores') {
      filtros = { username: username.trim(), maxFollowers: parseInt(maxFollowers) || 500 }
    } else {
      filtros = {
        searchTerms: searchTerms.split('\n').map(s => s.trim()).filter(Boolean),
        city: city.trim() || undefined,
        maxResults: parseInt(maxResults) || 100,
      }
    }

    try {
      const res = await fetch('/api/prospection/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fonte, filtros }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Erro ao iniciar'); return }
      onJobStarted(json.jobId)
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const INPUT = {
    background: 'var(--bg-surface-raised)',
    border: '1px solid var(--border-visible)',
    borderRadius: '6px',
    padding: '8px 10px',
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
    fontSize: '13px',
    width: '100%',
    outline: 'none',
  }

  const LABEL = 'font-mono text-[9px] uppercase tracking-[0.08em]'

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Source tabs */}
      <div>
        <span className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '10px' }}>
          FONTE
        </span>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(Object.keys(FONTE_LABELS) as Fonte[]).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFonte(f)}
              className="font-mono text-[10px] uppercase"
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: fonte === f ? '1px solid var(--accent)' : '1px solid var(--border-visible)',
                background: fonte === f ? 'var(--accent)' : 'var(--bg-surface-raised)',
                color: fonte === f ? 'var(--bg-base)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 150ms',
              }}
            >
              {FONTE_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* IG Comments fields */}
      {fonte === 'ig_comentarios' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              URLs DOS POSTS (uma por linha)
            </label>
            <textarea
              value={postUrls}
              onChange={e => setPostUrls(e.target.value)}
              placeholder="https://www.instagram.com/p/ABC123/"
              rows={4}
              required
              style={{ ...INPUT, resize: 'vertical' }}
            />
          </div>
          <div>
            <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              MÁX. COMENTÁRIOS
            </label>
            <input type="number" value={maxComments} onChange={e => setMaxComments(e.target.value)} min={10} max={1000} style={INPUT} />
          </div>
        </div>
      )}

      {/* IG Followers fields */}
      {fonte === 'ig_seguidores' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              PERFIL DO INSTAGRAM (username)
            </label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="username_sem_arroba"
              required
              style={INPUT}
            />
          </div>
          <div>
            <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              MÁX. SEGUIDORES
            </label>
            <input type="number" value={maxFollowers} onChange={e => setMaxFollowers(e.target.value)} min={10} max={2000} style={INPUT} />
          </div>
        </div>
      )}

      {/* Google Maps fields */}
      {fonte === 'google_maps' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              TERMOS DE BUSCA (um por linha)
            </label>
            <textarea
              value={searchTerms}
              onChange={e => setSearchTerms(e.target.value)}
              placeholder={'academia São Paulo\nbarbearia Vila Madalena'}
              rows={4}
              required
              style={{ ...INPUT, resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                CIDADE (opcional)
              </label>
              <input value={city} onChange={e => setCity(e.target.value)} placeholder="São Paulo" style={INPUT} />
            </div>
            <div>
              <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                MÁX. RESULTADOS
              </label>
              <input type="number" value={maxResults} onChange={e => setMaxResults(e.target.value)} min={10} max={500} style={INPUT} />
            </div>
          </div>
        </div>
      )}

      {error && (
        <span className="font-mono text-[10px]" style={{ color: 'var(--danger)' }}>{error}</span>
      )}

      <button
        type="submit"
        disabled={loading}
        className="font-mono text-[10px] uppercase tracking-[0.08em]"
        style={{
          padding: '10px 20px',
          background: loading ? 'var(--border-visible)' : 'var(--accent)',
          color: loading ? 'var(--text-disabled)' : 'var(--bg-base)',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          alignSelf: 'flex-start',
          transition: 'background 150ms',
        }}
      >
        {loading ? 'Iniciando...' : 'Iniciar Prospecção'}
      </button>
    </form>
  )
}
