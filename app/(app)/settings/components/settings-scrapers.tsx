'use client'

import { useActionState, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { saveScraperAction, type ActionState } from '../actions'

const initialState: ActionState = { error: null, success: false }
const LABEL = 'font-mono text-[9px] uppercase tracking-[0.08em]'

const INPUT_STYLE: React.CSSProperties = {
  background: 'var(--bg-base)',
  border: '1px solid var(--border-visible)',
  borderRadius: '6px',
  padding: '8px 10px',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
  fontSize: '12px',
  width: '100%',
  outline: 'none',
}

const SCRAPERS = [
  {
    id: 'remodel',
    label: 'REMODELAR',
    actor: 'apify/instagram-scraper',
    description: 'Extrai posts de um perfil para análise e remodelagem de conteúdo.',
    autoField: 'directUrls',
    defaultConfig: JSON.stringify({
      addParentData: false,
      resultsLimit: 20,
      resultsType: 'posts',
      searchLimit: 10,
      searchType: 'hashtag',
    }, null, 2),
  },
  {
    id: 'search',
    label: 'PESQUISA',
    actor: 'apify/instagram-scraper',
    description: 'Busca de perfis e posts por hashtag ou palavra-chave para prospecção.',
    autoField: 'search',
    defaultConfig: JSON.stringify({
      resultsLimit: 50,
      resultsType: 'posts',
      searchType: 'hashtag',
      searchLimit: 20,
    }, null, 2),
  },
  {
    id: 'followers',
    label: 'SEGUIDORES',
    actor: 'apify/instagram-follower-scraper',
    description: 'Exporta seguidores de um perfil concorrente para prospecção.',
    autoField: 'username',
    defaultConfig: JSON.stringify({
      maxItems: 500,
    }, null, 2),
  },
  {
    id: 'comments',
    label: 'COMENTÁRIOS',
    actor: 'apify/instagram-comment-scraper',
    description: 'Coleta comentários de posts para captura de leads isca.',
    autoField: 'postUrls',
    defaultConfig: JSON.stringify({
      maxComments: 200,
    }, null, 2),
  },
] as const

interface ScraperSectionProps {
  id: string
  label: string
  actor: string
  description: string
  autoField: string
  defaultConfig: string
  initialKey: string | null
  initialConfig: Record<string, unknown> | null
}

function ScraperSection({ id, label, actor, description, autoField, defaultConfig, initialKey, initialConfig }: ScraperSectionProps) {
  const [open, setOpen] = useState(id === 'remodel')
  const [state, formAction, pending] = useActionState(saveScraperAction, initialState)
  const [configValue, setConfigValue] = useState(
    initialConfig ? JSON.stringify(initialConfig, null, 2) : defaultConfig
  )

  const hasKey = !!initialKey
  const isActive = hasKey

  return (
    <div style={{
      background: 'var(--bg-surface-raised)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '8px',
      overflow: 'hidden',
    }}>
      {/* Header — clickable to expand */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {open
            ? <ChevronDown size={13} style={{ color: 'var(--text-disabled)', flexShrink: 0 }} />
            : <ChevronRight size={13} style={{ color: 'var(--text-disabled)', flexShrink: 0 }} />
          }
          <span className={LABEL} style={{ color: 'var(--text-primary)' }}>{label}</span>
          <span className={LABEL} style={{ color: 'var(--text-disabled)' }}>{actor}</span>
        </div>
        <span style={{
          padding: '2px 8px',
          background: isActive ? 'var(--success-subtle)' : 'var(--border-subtle)',
          border: `1px solid ${isActive ? 'var(--success)' : 'var(--border-visible)'}`,
          borderRadius: '4px',
          flexShrink: 0,
        }}>
          <span className={LABEL} style={{ color: isActive ? 'var(--success)' : 'var(--text-disabled)' }}>
            {isActive ? 'CONFIGURADO' : 'SEM CHAVE'}
          </span>
        </span>
      </button>

      {/* Body */}
      {open && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border-subtle)' }}>
          <p className="font-sans text-xs" style={{ color: 'var(--text-secondary)', margin: '12px 0 14px' }}>
            {description}
          </p>

          <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="hidden" name="scraper_id" value={id} />

            {/* API Key */}
            <div>
              <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                APIFY API KEY
              </label>
              <input
                name="api_key"
                type="password"
                defaultValue={initialKey ?? ''}
                placeholder="apify_api_..."
                style={{ ...INPUT_STYLE, fontFamily: 'monospace' }}
              />
            </div>

            {/* JSON Config */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                <label className={LABEL} style={{ color: 'var(--text-secondary)' }}>
                  CONFIGURAÇÃO DO ATOR (JSON)
                </label>
                <span className={LABEL} style={{ color: 'var(--text-disabled)' }}>
                  <code style={{ color: 'var(--accent-text)', background: 'var(--accent-subtle)', padding: '1px 4px', borderRadius: '3px' }}>
                    {autoField}
                  </code>
                  {' '}preenchido automaticamente
                </span>
              </div>
              <textarea
                name="config"
                value={configValue}
                onChange={e => setConfigValue(e.target.value)}
                rows={8}
                spellCheck={false}
                style={{ ...INPUT_STYLE, fontFamily: 'monospace', fontSize: '11px', lineHeight: 1.6, resize: 'vertical', minHeight: '140px' }}
              />
            </div>

            {state.error && (
              <span className={LABEL} style={{ color: 'var(--danger)' }}>{state.error}</span>
            )}
            {state.success && (
              <span className={LABEL} style={{ color: 'var(--success)' }}>✓ SALVO</span>
            )}

            <div>
              <button
                type="submit"
                disabled={pending}
                style={{
                  padding: '6px 16px',
                  background: pending ? 'var(--border-visible)' : 'var(--accent)',
                  color: pending ? 'var(--text-disabled)' : 'var(--bg-base)',
                  border: 'none', borderRadius: '6px',
                  cursor: pending ? 'not-allowed' : 'pointer',
                }}
              >
                <span className={LABEL}>{pending ? 'SALVANDO...' : 'SALVAR'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export interface ScraperConfigs {
  remodel:   { key: string | null; config: Record<string, unknown> | null }
  search:    { key: string | null; config: Record<string, unknown> | null }
  followers: { key: string | null; config: Record<string, unknown> | null }
  comments:  { key: string | null; config: Record<string, unknown> | null }
}

export function SettingsScrapers({ scrapers }: { scrapers: ScraperConfigs }) {
  return (
    <section style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '12px',
      padding: '24px',
    }}>
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] block mb-1" style={{ color: 'var(--text-secondary)' }}>
        SCRAPERS APIFY
      </span>
      <p className="text-sm font-sans mb-5" style={{ color: 'var(--text-secondary)' }}>
        Cada funcionalidade usa seu próprio ator e chave de API Apify. Clique para expandir e configurar.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {SCRAPERS.map(s => (
          <ScraperSection
            key={s.id}
            {...s}
            initialKey={scrapers[s.id as keyof ScraperConfigs].key}
            initialConfig={scrapers[s.id as keyof ScraperConfigs].config}
          />
        ))}
      </div>
    </section>
  )
}
