'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, RotateCcw, FileText, Calendar, Fish, RefreshCw, Link, Upload, BookmarkPlus } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useMarketingAgent } from '@/hooks/useMarketingAgent'
import type { MarketingAgentMode } from '@/lib/anthropic/agents/marketing-agent'
import type { AgentMessage } from '@/hooks/useMarketingAgent'
import { createContentIdea } from '@/app/(app)/content/actions'

const MODES: { id: MarketingAgentMode; icon: typeof FileText; label: string; prompt: string; description: string }[] = [
  {
    id: 'roteiro',
    icon: FileText,
    label: 'ROTEIRO',
    prompt: 'Quero criar um roteiro de vídeo para o Instagram. Me ajuda a desenvolver?',
    description: 'Gero o roteiro completo com hook, estrutura e CTA',
  },
  {
    id: 'planejamento',
    icon: Calendar,
    label: 'PLANEJAMENTO',
    prompt: 'Quero planejar meu conteúdo do próximo mês. Cria um planejamento completo para mim?',
    description: 'Distribuo seus posts pelos 5 pilares com funil completo',
  },
  {
    id: 'isca',
    icon: Fish,
    label: 'POST ISCA',
    prompt: 'Quero criar ideias de posts isca com CTA de palavra-chave. O que você sugere?',
    description: 'Crio posts com CTA de palavra-chave + estratégia de isca',
  },
  {
    id: 'remodelagem',
    icon: RefreshCw,
    label: 'REMODELAR',
    prompt: 'Quero remodelar um conteúdo que funcionou bem. Vou te passar o link.',
    description: 'Analiso um conteúdo que funcionou e adapto para o seu nicho',
  },
]

const LABEL = 'font-mono text-[9px] uppercase tracking-[0.08em]'

const SELECT_STYLE: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-visible)',
  borderRadius: '6px',
  padding: '5px 8px',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
  fontSize: '11px',
  cursor: 'pointer',
  width: '100%',
  outline: 'none',
}

function extractTitle(content: string): string {
  const lines = content.split('\n')
  for (const line of lines) {
    const clean = line.replace(/^#{1,3}\s*/, '').replace(/\*+/g, '').trim()
    if (clean.length > 4) return clean.slice(0, 70)
  }
  return content.slice(0, 70)
}

function SaveIdeaPanel({ content, onClose }: { content: string; onClose: () => void }) {
  const [titulo, setTitulo] = useState(() => extractTitle(content))
  const [tipo, setTipo] = useState('reels')
  const [pilar, setPilar] = useState('educacional')
  const [objetivo, setObjetivo] = useState('autoridade')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!titulo.trim()) return
    setSaving(true)
    setError(null)
    const res = await createContentIdea({ titulo: titulo.trim(), tipo, pilar, objetivo, roteiro_sugestao: content })
    setSaving(false)
    if (res.error) { setError(res.error); return }
    setSaved(true)
    setTimeout(onClose, 2500)
  }

  if (saved) {
    return (
      <div style={{ marginTop: '8px', padding: '8px 12px', background: 'var(--success-subtle)', borderRadius: '8px', border: '1px solid var(--success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span className={LABEL} style={{ color: 'var(--success)' }}>✓ SALVA EM /CONTEÚDO → IDEIAS</span>
      </div>
    )
  }

  return (
    <div style={{ marginTop: '8px', padding: '12px', background: 'var(--bg-surface-raised)', borderRadius: '8px', border: '1px solid var(--border-visible)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span className={LABEL} style={{ color: 'var(--text-secondary)' }}>SALVAR COMO IDEIA</span>
        <button type="button" onClick={onClose} className={LABEL} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-disabled)' }}>✕</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-visible)', borderRadius: '6px', padding: '6px 10px', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '12px', width: '100%', outline: 'none' }}
          placeholder="Título da ideia"
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
          <div>
            <div className={LABEL} style={{ color: 'var(--text-disabled)', marginBottom: '3px' }}>TIPO</div>
            <select value={tipo} onChange={e => setTipo(e.target.value)} style={SELECT_STYLE}>
              {['reels', 'carrossel', 'story'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <div className={LABEL} style={{ color: 'var(--text-disabled)', marginBottom: '3px' }}>PILAR</div>
            <select value={pilar} onChange={e => setPilar(e.target.value)} style={SELECT_STYLE}>
              {['educacional', 'bastidores', 'prova_social', 'engajamento', 'promocional'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <div className={LABEL} style={{ color: 'var(--text-disabled)', marginBottom: '3px' }}>OBJETIVO</div>
            <select value={objetivo} onChange={e => setObjetivo(e.target.value)} style={SELECT_STYLE}>
              {['autoridade', 'isca', 'viralizacao', 'conversao', 'educacao'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
          {error && <span className="font-mono text-[10px]" style={{ color: 'var(--danger)', flex: 1 }}>{error}</span>}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !titulo.trim()}
            className={LABEL}
            style={{ padding: '6px 16px', background: saving ? 'var(--border-visible)' : 'var(--accent)', border: 'none', borderRadius: '6px', color: saving ? 'var(--text-disabled)' : 'var(--bg-base)', cursor: saving || !titulo.trim() ? 'not-allowed' : 'pointer' }}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface AgentChatProps {
  initialMode?: MarketingAgentMode
  conversationId?: string
  initialMessages?: AgentMessage[]
  onConversationCreated?: (id: string, titulo: string) => void
}

export function AgentChat({ initialMode = 'chat', conversationId, initialMessages, onConversationCreated }: AgentChatProps) {
  const [activeMode, setActiveMode] = useState<MarketingAgentMode>(initialMode)
  const [input, setInput] = useState('')
  const [remodelMode, setRemodelMode] = useState<'link' | 'upload'>('link')
  const [igUrl, setIgUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [savingMsgIdx, setSavingMsgIdx] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { messages, isStreaming, streamingContent, error, sendMessage, reset } = useMarketingAgent({
    conversationId,
    initialMessages,
    onConversationCreated,
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (file && file.size > 25 * 1024 * 1024) {
      setFileError('Arquivo muito grande — máximo 25MB')
      setSelectedFile(null)
      e.target.value = ''
      return
    }
    setFileError(null)
    setSelectedFile(file)
  }

  function clearFile() {
    setSelectedFile(null)
    setFileError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || isStreaming) return
    if (activeMode === 'remodelagem' && remodelMode === 'upload' && !selectedFile) return
    setInput('')
    setSavingMsgIdx(null)

    let remodelOpts: { igUrl?: string; file?: File } | undefined
    if (activeMode === 'remodelagem') {
      remodelOpts = remodelMode === 'upload'
        ? { file: selectedFile! }
        : { igUrl: igUrl || undefined }
    }

    await sendMessage(text, activeMode, remodelOpts)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleModeClick(mode: typeof MODES[number]) {
    setActiveMode(mode.id)
    if (messages.length === 0) {
      setInput(mode.prompt)
      inputRef.current?.focus()
    }
  }

  const isEmpty = messages.length === 0 && !isStreaming

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Mode bar */}
      <div style={{
        display: 'flex', gap: '6px', padding: '12px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0, flexWrap: 'wrap',
      }}>
        {MODES.map(m => {
          const Icon = m.icon
          const isActive = activeMode === m.id
          return (
            <button
              key={m.id}
              onClick={() => handleModeClick(m)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '5px 10px', borderRadius: '6px', cursor: 'pointer',
                border: `1px solid ${isActive ? 'var(--accent-border)' : 'var(--border-visible)'}`,
                background: isActive ? 'var(--accent-subtle)' : 'transparent',
                transition: 'all 150ms ease-out',
              }}
            >
              <Icon size={12} style={{ color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)' }} />
              <span className={LABEL} style={{ color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)' }}>
                {m.label}
              </span>
            </button>
          )
        })}
        {activeMode !== 'chat' && messages.length > 0 && (
          <button
            onClick={reset}
            style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px',
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
            }}
          >
            <RotateCcw size={12} style={{ color: 'var(--text-disabled)' }} />
            <span className={LABEL} style={{ color: 'var(--text-disabled)' }}>NOVA CONVERSA</span>
          </button>
        )}
      </div>

      {/* Remodelagem bar — link/upload toggle */}
      {activeMode === 'remodelagem' && (
        <div style={{
          padding: '10px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--accent-subtle)',
          flexShrink: 0,
          display: 'flex', flexDirection: 'column', gap: '8px',
        }}>
          {/* Toggle */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['link', 'upload'] as const).map(m => {
              const isActive = remodelMode === m
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setRemodelMode(m)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '3px 10px', borderRadius: '5px', cursor: 'pointer',
                    border: `1px solid ${isActive ? 'var(--accent-border)' : 'var(--border-visible)'}`,
                    background: isActive ? 'var(--accent)' : 'transparent',
                  }}
                >
                  {m === 'link'
                    ? <Link size={10} style={{ color: isActive ? 'var(--bg-base)' : 'var(--text-secondary)' }} />
                    : <Upload size={10} style={{ color: isActive ? 'var(--bg-base)' : 'var(--text-secondary)' }} />
                  }
                  <span className={LABEL} style={{ color: isActive ? 'var(--bg-base)' : 'var(--text-secondary)' }}>
                    {m === 'link' ? 'POR LINK' : 'POR UPLOAD'}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Link mode */}
          {remodelMode === 'link' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link size={12} style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
              <input
                type="url"
                value={igUrl}
                onChange={e => setIgUrl(e.target.value)}
                placeholder="Cole o link do post ou Reel do Instagram"
                className="font-sans text-xs"
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)' }}
              />
            </div>
          )}

          {/* Upload mode */}
          {remodelMode === 'upload' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,audio/*,.mp4,.mp3,.m4a,.mov,.wav,.webm"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '4px 10px', borderRadius: '5px', cursor: 'pointer',
                    border: '1px solid var(--border-visible)',
                    background: 'var(--bg-surface)',
                  }}
                >
                  <Upload size={11} style={{ color: 'var(--text-secondary)' }} />
                  <span className={LABEL} style={{ color: 'var(--text-secondary)' }}>SELECIONAR</span>
                </button>
                {selectedFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                    <span className="font-mono text-[10px]" style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={clearFile}
                      className={LABEL}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-disabled)', flexShrink: 0 }}
                    >✕</button>
                  </div>
                ) : (
                  <span className={LABEL} style={{ color: 'var(--text-disabled)' }}>mp4 · mp3 · m4a · até 25MB</span>
                )}
              </div>
              {fileError && (
                <span className={LABEL} style={{ color: 'var(--danger)', display: 'block', marginTop: '4px' }}>{fileError}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

        {/* Empty state — quick action grid */}
        {isEmpty && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--text-disabled)' }}>
                AGENTE DE MARKETING
              </span>
              <p className="font-sans text-sm" style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                Estrategista de conteúdo B2B para Instagram. Selecione um modo ou escreva livremente.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxWidth: '560px', margin: '0 auto' }}>
              {MODES.map(m => {
                const Icon = m.icon
                return (
                  <button
                    key={m.id}
                    onClick={() => handleModeClick(m)}
                    style={{
                      padding: '16px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'border-color 150ms ease-out, background 150ms ease-out',
                    }}
                    className="hover:border-[var(--border-visible)] hover:bg-[var(--bg-surface-raised)]"
                  >
                    <Icon size={16} style={{ color: 'var(--accent-text)', marginBottom: '8px' }} />
                    <div className={LABEL} style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>{m.label}</div>
                    <div className="font-sans text-xs" style={{ color: 'var(--text-secondary)' }}>{m.description}</div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Message list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '760px', margin: '0 auto' }}>
          {messages.map((m, i) => (
            <div key={i}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '12px 16px',
                    borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    background: m.role === 'user' ? 'var(--bg-surface-raised)' : 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {m.role === 'user' ? (
                    <p className="font-sans text-sm" style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                      {m.content}
                    </p>
                  ) : (
                    <div
                      className="font-sans text-sm markdown-agent"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>

              {/* Save as idea — shown below assistant messages only */}
              {m.role === 'assistant' && !isStreaming && (
                <div style={{ paddingLeft: '4px' }}>
                  {savingMsgIdx === i ? (
                    <SaveIdeaPanel
                      content={m.content}
                      onClose={() => setSavingMsgIdx(null)}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSavingMsgIdx(i)}
                      style={{
                        marginTop: '6px',
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        background: 'none', border: 'none', cursor: 'pointer', padding: '3px 6px',
                        borderRadius: '5px',
                        opacity: 0.6,
                        transition: 'opacity 150ms',
                      }}
                      className="hover:opacity-100"
                    >
                      <BookmarkPlus size={11} style={{ color: 'var(--text-disabled)' }} />
                      <span className={LABEL} style={{ color: 'var(--text-disabled)', fontSize: '8px' }}>SALVAR COMO IDEIA</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Streaming message */}
          {isStreaming && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div
                style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: '12px 12px 12px 4px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {streamingContent ? (
                  <div className="font-sans text-sm markdown-agent" style={{ color: 'var(--text-primary)' }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {streamingContent}
                    </ReactMarkdown>
                    <span style={{ display: 'inline-block', width: '2px', height: '14px', background: 'var(--accent)', marginLeft: '2px', animation: 'cursor-blink 1s step-end infinite', verticalAlign: 'text-bottom' }} />
                  </div>
                ) : (
                  <span className={LABEL} style={{ color: 'var(--text-disabled)' }}>PENSANDO...</span>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: '10px 14px', background: 'var(--danger-subtle)', border: '1px solid var(--danger)', borderRadius: '8px', maxWidth: '560px' }}>
              <span className="font-sans text-xs" style={{ color: 'var(--danger)' }}>{error}</span>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-base)',
        flexShrink: 0,
      }}>
        {messages.length > 0 && !isStreaming && (
          <button
            onClick={reset}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '0 0 8px 0',
            }}
          >
            <RotateCcw size={11} style={{ color: 'var(--text-disabled)' }} />
            <span className={LABEL} style={{ color: 'var(--text-disabled)' }}>NOVA CONVERSA</span>
          </button>
        )}
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: '8px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-visible)',
          borderRadius: '10px',
          padding: '10px 12px',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={activeMode === 'chat' ? 'Pergunte sobre estratégia, hooks, algoritmo...' : `Modo ${MODES.find(m => m.id === activeMode)?.label.toLowerCase()} ativo — descreva o que precisa`}
            rows={1}
            disabled={isStreaming}
            className="font-sans text-sm"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              resize: 'none', color: 'var(--text-primary)',
              maxHeight: '120px', overflowY: 'auto',
              lineHeight: '1.5',
            }}
            onInput={e => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming || (activeMode === 'remodelagem' && remodelMode === 'upload' && !selectedFile)}
            style={{
              width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
              background: (input.trim() && !isStreaming && !(activeMode === 'remodelagem' && remodelMode === 'upload' && !selectedFile)) ? 'var(--accent)' : 'var(--border-visible)',
              border: 'none', cursor: (input.trim() && !isStreaming && !(activeMode === 'remodelagem' && remodelMode === 'upload' && !selectedFile)) ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 150ms ease-out',
            }}
          >
            <Send size={14} style={{ color: (input.trim() && !isStreaming && !(activeMode === 'remodelagem' && remodelMode === 'upload' && !selectedFile)) ? 'var(--bg-base)' : 'var(--text-disabled)' }} />
          </button>
        </div>
        <p className={LABEL} style={{ color: 'var(--text-disabled)', marginTop: '6px' }}>
          ENTER para enviar · SHIFT+ENTER para nova linha
        </p>
      </div>
    </div>
  )
}
