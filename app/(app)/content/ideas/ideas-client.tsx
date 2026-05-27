'use client'

import { useState, useRef, useEffect } from 'react'
import { IdeaModal } from './idea-modal'
import { MarketingAgentDrawer } from '@/app/(app)/agent/components/marketing-agent-drawer'
import { updateContentIdea } from '../actions'

interface Idea {
  id: string
  titulo: string
  tipo: string | null
  pilar: string | null
  objetivo: string | null
  status: string
  data_agendada: string | null
  palavra_isca: string | null
  created_at: string
}

interface IdeasClientProps {
  ideas: Idea[]
  marketingContext: Record<string, unknown>
}

const STATUSES = ['ideia', 'producao', 'agendado', 'publicado'] as const
type Status = typeof STATUSES[number]

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  ideia:     { bg: 'var(--border-subtle)',   color: 'var(--text-secondary)' },
  producao:  { bg: 'var(--warning-subtle)',  color: 'var(--warning)' },
  agendado:  { bg: 'var(--accent)',          color: 'var(--bg-base)' },
  publicado: { bg: 'var(--success-subtle)',  color: 'var(--success)' },
}

const PILAR_COLOR: Record<string, string> = {
  educacional: 'var(--accent)',
  bastidores:  'var(--warning)',
  prova_social:'var(--success)',
  engajamento: '#a78bfa',
  promocional: 'var(--danger)',
}

function StatusPill({ ideaId, status, onStatusChange }: { ideaId: string; status: string; onStatusChange: (id: string, s: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.ideia
  const LABEL = 'font-mono text-[9px] uppercase tracking-[0.08em]'

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        className={LABEL}
        style={{
          padding: '2px 7px', borderRadius: '4px',
          background: badge.bg, color: badge.color,
          border: 'none', cursor: 'pointer',
          transition: 'opacity 120ms',
        }}
      >
        {status}
      </button>
      {open && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 50,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-visible)',
            borderRadius: '7px',
            padding: '4px',
            minWidth: '110px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}
        >
          {STATUSES.map(s => {
            const b = STATUS_BADGE[s]
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  onStatusChange(ideaId, s)
                  setOpen(false)
                }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 8px', borderRadius: '5px', cursor: 'pointer',
                  background: s === status ? 'var(--bg-surface-raised)' : 'transparent',
                  border: 'none',
                  transition: 'background 100ms',
                }}
                className="hover:bg-[var(--bg-surface-raised)]"
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: b.color, flexShrink: 0 }} />
                <span className={LABEL} style={{ color: 'var(--text-secondary)' }}>{s}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function IdeasClient({ ideas: initialIdeas, marketingContext }: IdeasClientProps) {
  const [ideas, setIdeas] = useState<Idea[]>(initialIdeas)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [filterTipo, setFilterTipo] = useState<string>('todos')
  const [agentOpen, setAgentOpen] = useState(false)

  const LABEL = 'font-mono text-[9px] uppercase tracking-[0.08em]'

  const filtered = ideas.filter(idea => {
    if (filterStatus !== 'todos' && idea.status !== filterStatus) return false
    if (filterTipo !== 'todos' && idea.tipo !== filterTipo) return false
    return true
  })

  function openCreate() {
    setEditingIdea(null)
    setModalOpen(true)
  }

  function openEdit(idea: Idea) {
    setEditingIdea(idea)
    setModalOpen(true)
  }

  async function handleStatusChange(ideaId: string, newStatus: string) {
    // Optimistic update
    setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, status: newStatus } : i))
    const res = await updateContentIdea(ideaId, { status: newStatus })
    if (res.error) {
      // Revert on error
      setIdeas(initialIdeas)
    }
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {modalOpen && (
        <IdeaModal
          idea={editingIdea}
          marketingContext={marketingContext}
          onClose={() => setModalOpen(false)}
        />
      )}

      <MarketingAgentDrawer
        open={agentOpen}
        onClose={() => setAgentOpen(false)}
        mode="roteiro"
        title="GERAR ROTEIRO"
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--text-secondary)' }}>
          BANCO DE IDEIAS — {filtered.length}
        </span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setAgentOpen(true)}
            className={LABEL}
            style={{
              padding: '7px 12px',
              background: 'var(--accent-subtle)',
              border: '1px solid var(--accent-border)',
              borderRadius: '6px',
              color: 'var(--accent-text)',
              cursor: 'pointer',
            }}
          >
            ✨ Gerar com IA
          </button>
          <button
            type="button"
            onClick={openCreate}
            className={LABEL}
            style={{
              padding: '7px 14px',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: '6px',
              color: 'var(--bg-base)',
              cursor: 'pointer',
            }}
          >
            + Nova Ideia
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['todos', 'ideia', 'producao', 'agendado', 'publicado'].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s)}
              className={LABEL}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: filterStatus === s ? '1px solid var(--accent)' : '1px solid transparent',
                background: filterStatus === s ? 'var(--accent)' : 'transparent',
                color: filterStatus === s ? 'var(--bg-base)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['todos', 'reels', 'carrossel', 'story'].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterTipo(t)}
              className={LABEL}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: filterTipo === t ? '1px solid var(--border-visible)' : '1px solid transparent',
                background: filterTipo === t ? 'var(--bg-surface-raised)' : 'transparent',
                color: filterTipo === t ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Ideas grid */}
      {filtered.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <span className={LABEL} style={{ color: 'var(--text-disabled)' }}>[SEM IDEIAS]</span>
          <p className="font-sans text-sm" style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Crie sua primeira ideia de conteúdo.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {filtered.map(idea => (
            <div
              key={idea.id}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '14px',
                borderLeft: `3px solid ${PILAR_COLOR[idea.pilar ?? ''] ?? 'var(--border-subtle)'}`,
                cursor: 'pointer',
                transition: 'border-color 150ms',
              }}
              onClick={() => openEdit(idea)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                <span className="font-sans text-sm" style={{ color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.4 }}>
                  {idea.titulo}
                </span>
                <StatusPill
                  ideaId={idea.id}
                  status={idea.status}
                  onStatusChange={handleStatusChange}
                />
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span className={LABEL} style={{ color: 'var(--text-disabled)' }}>{idea.tipo}</span>
                <span className={LABEL} style={{ color: PILAR_COLOR[idea.pilar ?? ''] ?? 'var(--text-disabled)' }}>{idea.pilar}</span>
                {idea.palavra_isca && (
                  <span className={LABEL} style={{ color: 'var(--accent)' }}>isca: {idea.palavra_isca}</span>
                )}
              </div>
              {idea.data_agendada && (
                <div style={{ marginTop: '8px' }}>
                  <span className={LABEL} style={{ color: 'var(--text-disabled)' }}>
                    {new Date(idea.data_agendada).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
