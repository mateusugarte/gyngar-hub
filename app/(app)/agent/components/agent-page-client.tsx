'use client'

import { useState, useCallback } from 'react'
import { PlusCircle, MessageSquare, Trash2 } from 'lucide-react'
import { AgentChat } from './agent-chat'
import type { AgentMessage } from '@/hooks/useMarketingAgent'

interface ConvSummary {
  id: string
  titulo: string | null
  created_at: string
}

interface AgentPageClientProps {
  initialConversations: ConvSummary[]
}

const LABEL = 'font-mono text-[9px] uppercase tracking-[0.08em]'

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) return `${diffDays}d atrás`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function AgentPageClient({ initialConversations }: AgentPageClientProps) {
  const [conversations, setConversations] = useState<ConvSummary[]>(initialConversations)
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [loadedMessages, setLoadedMessages] = useState<AgentMessage[]>([])
  const [loadingConv, setLoadingConv] = useState(false)
  const [chatKey, setChatKey] = useState(0)

  async function selectConversation(id: string) {
    if (id === selectedConvId) return
    setLoadingConv(true)
    try {
      const res = await fetch(`/api/agent/conversations/${id}/messages`)
      const data = await res.json() as { role: string; content: string }[]
      setLoadedMessages(data.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })))
      setSelectedConvId(id)
      setChatKey(k => k + 1)
    } finally {
      setLoadingConv(false)
    }
  }

  function startNewConversation() {
    setSelectedConvId(null)
    setLoadedMessages([])
    setChatKey(k => k + 1)
  }

  const handleConversationCreated = useCallback((id: string, titulo: string) => {
    setSelectedConvId(id)
    setConversations(prev => {
      if (prev.some(c => c.id === id)) return prev
      return [{ id, titulo, created_at: new Date().toISOString() }, ...prev]
    })
  }, [])

  async function deleteConversation(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    // Optimistic remove
    setConversations(prev => prev.filter(c => c.id !== id))
    if (selectedConvId === id) startNewConversation()
    // Fire-and-forget — no dedicated delete endpoint yet, handled client-side only
  }

  return (
    <div style={{ display: 'flex', height: '100%' }}>

      {/* Sidebar */}
      <div style={{
        width: '220px', flexShrink: 0,
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg-base)',
      }}>
        {/* Sidebar header */}
        <div style={{ padding: '14px 12px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <button
            onClick={startNewConversation}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '7px',
              padding: '8px 10px', borderRadius: '7px', cursor: 'pointer',
              background: 'var(--accent-subtle)',
              border: '1px solid var(--accent-border)',
            }}
          >
            <PlusCircle size={13} style={{ color: 'var(--accent-text)' }} />
            <span className={LABEL} style={{ color: 'var(--accent-text)' }}>NOVA CONVERSA</span>
          </button>
        </div>

        {/* Conversations list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {conversations.length === 0 ? (
            <div style={{ padding: '24px 8px', textAlign: 'center' }}>
              <span className={LABEL} style={{ color: 'var(--text-disabled)' }}>SEM HISTÓRICO</span>
            </div>
          ) : (
            conversations.map(conv => {
              const isActive = conv.id === selectedConvId
              return (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '6px',
                    padding: '8px 8px',
                    borderRadius: '7px',
                    cursor: 'pointer',
                    background: isActive ? 'var(--accent-subtle)' : 'transparent',
                    border: isActive ? '1px solid var(--accent-border)' : '1px solid transparent',
                    marginBottom: '2px',
                    transition: 'background 120ms',
                    position: 'relative',
                  }}
                  className={isActive ? '' : 'hover:bg-[var(--bg-surface)]'}
                >
                  <MessageSquare size={12} style={{ color: isActive ? 'var(--accent-text)' : 'var(--text-disabled)', marginTop: '1px', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      className="font-sans text-xs"
                      style={{
                        color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        lineHeight: 1.4, fontWeight: isActive ? 500 : 400,
                      }}
                    >
                      {conv.titulo ?? 'Conversa'}
                    </p>
                    <span className={LABEL} style={{ color: 'var(--text-disabled)', fontSize: '8px' }}>
                      {formatDate(conv.created_at)}
                    </span>
                  </div>
                  <button
                    onClick={e => deleteConversation(e, conv.id)}
                    style={{
                      opacity: 0, background: 'none', border: 'none', cursor: 'pointer',
                      padding: '2px', borderRadius: '3px', flexShrink: 0,
                      transition: 'opacity 120ms',
                    }}
                    className="group-hover:opacity-100"
                    title="Remover do histórico"
                  >
                    <Trash2 size={10} style={{ color: 'var(--text-disabled)' }} />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', gap: '10px',
          flexShrink: 0,
        }}>
          <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--text-secondary)' }}>
            AGENTE DE MARKETING
          </span>
          <span style={{
            padding: '2px 7px',
            background: 'var(--accent-subtle)',
            border: '1px solid var(--accent-border)',
            borderRadius: '4px',
          }}>
            <span className="font-mono text-[9px] uppercase tracking-[0.06em]" style={{ color: 'var(--accent-text)' }}>IA</span>
          </span>
          {selectedConvId && (
            <span className={LABEL} style={{ color: 'var(--text-disabled)', marginLeft: 'auto' }}>
              {conversations.find(c => c.id === selectedConvId)?.titulo ?? 'CONVERSA'}
            </span>
          )}
        </div>

        {/* Chat — remount via key when conversation changes */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {loadingConv ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className={LABEL} style={{ color: 'var(--text-disabled)' }}>CARREGANDO...</span>
            </div>
          ) : (
            <AgentChat
              key={chatKey}
              conversationId={selectedConvId ?? undefined}
              initialMessages={loadedMessages}
              onConversationCreated={handleConversationCreated}
            />
          )}
        </div>
      </div>
    </div>
  )
}
