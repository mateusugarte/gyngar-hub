'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, CheckCircle, AlertCircle, Loader2, AlertTriangle, RefreshCw, Users, LayoutGrid } from 'lucide-react'

interface IgProfile {
  id: string
  username: string
  name?: string
  biography?: string
  profile_picture_url?: string
  followers_count?: number
  follows_count?: number
  media_count?: number
  website?: string
}

interface SettingsInstagramProps {
  connected: boolean
  accountId: string | null
  igUsername?: string | null
  successMsg?: string | null
  errorMsg?: string | null
  envConfigured: boolean
}

export function SettingsInstagram({
  connected,
  accountId,
  igUsername,
  successMsg,
  errorMsg,
  envConfigured,
}: SettingsInstagramProps) {
  const [disconnecting, setDisconnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)
  const [profile, setProfile] = useState<IgProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const router = useRouter()

  const LABEL = 'font-mono text-[9px] uppercase tracking-[0.08em]'

  useEffect(() => {
    if (!connected) return
    const load = async () => {
      setProfileLoading(true)
      try {
        const r = await fetch('/api/instagram/profile')
        setProfile(r.ok ? await r.json() : null)
      } catch {
        setProfile(null)
      } finally {
        setProfileLoading(false)
      }
    }
    void load()
  }, [connected])

  async function handleSync() {
    setSyncing(true)
    setSyncMsg(null)
    setLocalError(null)
    try {
      const res = await fetch('/api/instagram/sync', { method: 'POST' })
      const json = await res.json()
      if (res.ok) setSyncMsg(`${json.synced} posts sincronizados com sucesso`)
      else setLocalError(json.error ?? 'Erro ao sincronizar')
    } finally {
      setSyncing(false)
    }
  }

  async function handleDisconnect() {
    if (!confirm('Desconectar o Instagram? Os posts sincronizados serão mantidos.')) return
    setDisconnecting(true)
    setLocalError(null)
    try {
      const res = await fetch('/api/instagram/disconnect', { method: 'POST' })
      if (!res.ok) {
        const json = await res.json()
        setLocalError(json.error ?? 'Erro ao desconectar')
      } else {
        router.refresh()
      }
    } finally {
      setDisconnecting(false)
    }
  }

  const displayHandle = profile?.username
    ? `@${profile.username}`
    : igUsername
      ? `@${igUsername}`
      : accountId ?? ''

  function formatNum(n: number) {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
    return String(n)
  }

  return (
    <section
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${connected ? 'var(--success)' : 'var(--border-subtle)'}`,
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        transition: 'border-color 300ms ease-out',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: connected ? 'var(--success-subtle)' : 'var(--bg-surface-raised)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Camera size={18} style={{ color: connected ? 'var(--success)' : 'var(--text-secondary)' }} />
        </div>
        <div>
          <p className="font-sans text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Instagram</p>
          <span className={LABEL} style={{ color: connected ? 'var(--success)' : 'var(--text-secondary)' }}>
            {connected ? 'Conectado' : 'Não conectado'}
          </span>
        </div>
        {connected && <CheckCircle size={15} style={{ color: 'var(--success)', marginLeft: 'auto' }} />}
      </div>

      {/* Aviso env não configurada */}
      {!envConfigured && !connected && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '10px',
          padding: '12px 14px', background: 'var(--warning-subtle)',
          border: '1px solid var(--warning)', borderRadius: '8px',
        }}>
          <AlertTriangle size={14} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '1px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span className={LABEL} style={{ color: 'var(--warning)' }}>META_APP_ID ou META_APP_SECRET não configurados</span>
            <span className="font-sans text-xs" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Preencha <code style={{ background: 'var(--bg-surface-raised)', padding: '1px 4px', borderRadius: '3px' }}>.env.local</code> e reinicie o servidor.
            </span>
          </div>
        </div>
      )}

      {/* Card de perfil (quando conectado) */}
      {connected && (
        <div style={{
          background: 'var(--bg-surface-raised)',
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start',
        }}>
          {/* Foto de perfil */}
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'var(--bg-base)',
            border: '2px solid var(--border-visible)',
            flexShrink: 0,
            overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {profileLoading ? (
              <Loader2 size={16} style={{ color: 'var(--text-disabled)' }} className="animate-spin" />
            ) : profile?.profile_picture_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.profile_picture_url}
                alt={`Foto de perfil de ${profile.username}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Camera size={20} style={{ color: 'var(--text-disabled)' }} />
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {profileLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ height: '14px', width: '120px', background: 'var(--border-subtle)', borderRadius: '4px' }} />
                <div style={{ height: '11px', width: '80px', background: 'var(--border-subtle)', borderRadius: '4px' }} />
              </div>
            ) : (
              <>
                <p className="font-sans text-sm font-medium" style={{ color: 'var(--text-primary)', marginBottom: '2px' }}>
                  {profile?.name ?? displayHandle}
                </p>
                <p className={LABEL} style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  {displayHandle}
                </p>

                {/* Stats */}
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: profile?.biography ? '10px' : '0' }}>
                  {profile?.followers_count !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Users size={11} style={{ color: 'var(--text-secondary)' }} />
                      <span className="font-mono text-[11px]" style={{ color: 'var(--text-primary)' }}>
                        {formatNum(profile.followers_count)}
                      </span>
                      <span className={LABEL} style={{ color: 'var(--text-secondary)' }}>seguidores</span>
                    </div>
                  )}
                  {profile?.media_count !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <LayoutGrid size={11} style={{ color: 'var(--text-secondary)' }} />
                      <span className="font-mono text-[11px]" style={{ color: 'var(--text-primary)' }}>
                        {profile.media_count}
                      </span>
                      <span className={LABEL} style={{ color: 'var(--text-secondary)' }}>posts</span>
                    </div>
                  )}
                </div>

                {/* Bio */}
                {profile?.biography && (
                  <p className="font-sans text-xs" style={{
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-line',
                    marginTop: '8px',
                  }}>
                    {profile.biography}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Sucesso */}
      {successMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--success-subtle)', borderRadius: '8px', border: '1px solid var(--success)' }}>
          <CheckCircle size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
          <span className="font-sans text-[13px]" style={{ color: 'var(--success)' }}>{successMsg}</span>
        </div>
      )}

      {/* Mensagem de sync */}
      {syncMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--success-subtle)', borderRadius: '8px', border: '1px solid var(--success)' }}>
          <CheckCircle size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
          <span className="font-sans text-[13px]" style={{ color: 'var(--success)' }}>{syncMsg}</span>
        </div>
      )}

      {/* Erro */}
      {(errorMsg || localError) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 14px', background: 'var(--danger-subtle)', borderRadius: '8px', border: '1px solid var(--danger)' }}>
          <AlertCircle size={14} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '1px' }} />
          <span className="font-sans text-[12px]" style={{ color: 'var(--danger)', lineHeight: 1.5 }}>
            {errorMsg ?? localError}
          </span>
        </div>
      )}

      {/* Instruções pré-conexão */}
      {!connected && envConfigured && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <p className="font-sans text-xs" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Conecte uma conta <strong>Instagram Business</strong> vinculada a uma Página do Facebook
            para sincronizar posts, métricas e capturar leads via comentários.
          </p>
          <ul className="font-sans text-xs" style={{ color: 'var(--text-secondary)', paddingLeft: '16px', lineHeight: 1.8 }}>
            <li>Você precisa ser Administrador da Página do Facebook</li>
            <li>A conta IG deve ser Comercial ou de Criador</li>
            <li>A Página do Facebook deve estar vinculada à conta IG</li>
          </ul>
        </div>
      )}

      {/* Ações */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {!connected ? (
          <a
            href="/api/instagram/connect"
            className={LABEL}
            style={{
              padding: '8px 18px', background: 'var(--accent)', borderRadius: '6px',
              color: 'var(--bg-base)', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: '6px',
            }}
          >
            <Camera size={12} />
            Conectar Instagram
          </a>
        ) : (
          <>
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className={LABEL}
              style={{
                padding: '8px 18px', background: 'transparent',
                border: '1px solid var(--border-visible)', borderRadius: '6px',
                color: syncing ? 'var(--text-disabled)' : 'var(--text-secondary)',
                cursor: syncing ? 'not-allowed' : 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: '6px',
              }}
            >
              {syncing
                ? <Loader2 size={11} className="animate-spin" />
                : <RefreshCw size={11} />}
              {syncing ? 'Sincronizando...' : 'Sincronizar Posts'}
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className={LABEL}
              style={{
                padding: '8px 18px', background: 'transparent',
                border: '1px solid var(--danger)', borderRadius: '6px',
                color: disconnecting ? 'var(--text-disabled)' : 'var(--danger)',
                cursor: disconnecting ? 'not-allowed' : 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: '6px',
              }}
            >
              {disconnecting && <Loader2 size={11} className="animate-spin" />}
              {disconnecting ? 'Desconectando...' : 'Desconectar'}
            </button>
          </>
        )}
      </div>
    </section>
  )
}
