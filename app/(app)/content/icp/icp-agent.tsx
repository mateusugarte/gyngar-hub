'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, CheckCircle, RefreshCw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { saveMarketingContext } from '../actions'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const ICP_DRAFT_RE = /\[ICP_DRAFT\]([\s\S]*?)\[\/ICP_DRAFT\]/

// Strip the [ICP_DRAFT] block from text before rendering
function stripDraft(content: string) {
  return content.replace(ICP_DRAFT_RE, '').trim()
}

function parseDraft(content: string): Record<string, unknown> | null {
  const match = ICP_DRAFT_RE.exec(content)
  if (!match) return null
  try {
    return JSON.parse(match[1].trim())
  } catch {
    return null
  }
}

const LABEL = 'font-mono text-[9px] uppercase tracking-[0.08em]'

// ─── ICP Preview card ────────────────────────────────────────────────────────

function IcpPreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div className={LABEL} style={{ color: 'var(--accent-text)', marginBottom: '6px' }}>{title}</div>
      <div className="font-sans text-xs" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  )
}

function Pill({ label }: { label: string }) {
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', marginRight: '4px', marginBottom: '4px' }}>
      <span className={LABEL} style={{ color: 'var(--accent-text)' }}>{label}</span>
    </span>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function IcpPreview({ draft, onSave, saving, saved }: { draft: Record<string, any>; onSave: () => void; saving: boolean; saved: boolean }) {
  const p = draft.produto ?? {}
  const d = draft.diferencial ?? {}
  const firm = draft.icp_firmografico ?? {}
  const psico = draft.icp_psicografico ?? {}
  const persona = draft.persona ?? {}
  const voz = draft.voz_marca ?? {}
  const social = draft.prova_social ?? {}

  return (
    <div style={{
      margin: '16px 0',
      background: 'var(--bg-surface)',
      border: '1px solid var(--accent-border)',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', background: 'var(--accent-subtle)', borderBottom: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Sparkles size={13} style={{ color: 'var(--accent-text)' }} />
        <span className={LABEL} style={{ color: 'var(--accent-text)' }}>RASCUNHO DE ICP GERADO</span>
      </div>

      {/* Content */}
      <div style={{ padding: '16px', maxHeight: '360px', overflowY: 'auto' }}>
        {p.descricao && (
          <IcpPreviewSection title="PRODUTO / SERVIÇO">
            {p.descricao}
            {(p.categoria || p.modelo) && (
              <div style={{ marginTop: '4px' }}>
                {p.categoria && <Pill label={p.categoria} />}
                {p.modelo && <Pill label={p.modelo} />}
              </div>
            )}
          </IcpPreviewSection>
        )}

        {d.proposta && (
          <IcpPreviewSection title="PROPOSTA DE VALOR">
            {d.proposta}
            {d.diferenciais && <p style={{ marginTop: '4px', color: 'var(--text-disabled)' }}>{d.diferenciais}</p>}
          </IcpPreviewSection>
        )}

        {(firm.portes?.length > 0 || firm.segmentos?.length > 0) && (
          <IcpPreviewSection title="ICP FIRMOGRÁFICO">
            {firm.portes?.map((p: string) => <Pill key={p} label={p} />)}
            {firm.segmentos?.map((s: string) => <Pill key={s} label={s} />)}
            {firm.cidades?.length > 0 && <p style={{ marginTop: '4px' }}>{firm.cidades.join(', ')}</p>}
          </IcpPreviewSection>
        )}

        {psico.dor && (
          <IcpPreviewSection title="DOR PRINCIPAL">
            {psico.dor}
            {psico.gatilho && <div style={{ marginTop: '4px' }}><Pill label={psico.gatilho} /></div>}
          </IcpPreviewSection>
        )}

        {persona.nome && (
          <IcpPreviewSection title="PERSONA">
            <strong>{persona.nome}</strong>{persona.cargo ? ` — ${persona.cargo}` : ''}{persona.faixa_etaria ? `, ${persona.faixa_etaria}` : ''}<br />
            {persona.objetivo && <span>Objetivo: {persona.objetivo}<br /></span>}
            {persona.medo && <span style={{ color: 'var(--warning)' }}>Medo: {persona.medo}</span>}
          </IcpPreviewSection>
        )}

        {voz.adjetivos?.length > 0 && (
          <IcpPreviewSection title="VOZ DA MARCA">
            {voz.adjetivos.map((a: string) => <Pill key={a} label={a} />)}
            {voz.jtbd && <Pill label={voz.jtbd} />}
          </IcpPreviewSection>
        )}

        {social.resultados && (
          <IcpPreviewSection title="PROVA SOCIAL">
            {social.resultados}
            {social.n_clientes > 0 && <p style={{ marginTop: '4px' }}>{social.n_clientes} clientes atendidos</p>}
          </IcpPreviewSection>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {saved ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle size={14} style={{ color: 'var(--success)' }} />
            <span className={LABEL} style={{ color: 'var(--success)' }}>ICP SALVO — CONTEXTO ATUALIZADO</span>
          </div>
        ) : (
          <>
            <span className="font-sans text-xs" style={{ color: 'var(--text-disabled)' }}>
              Revise e refine na conversa antes de salvar
            </span>
            <button
              onClick={onSave}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 16px', borderRadius: '7px', border: 'none',
                background: saving ? 'var(--border-visible)' : 'var(--accent)',
                color: saving ? 'var(--text-disabled)' : 'var(--bg-base)',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? (
                <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <CheckCircle size={12} />
              )}
              <span className={LABEL} style={{ color: 'inherit' }}>
                {saving ? 'SALVANDO...' : 'APLICAR ICP'}
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface IcpAgentProps {
  existingContext: Record<string, unknown>
}

export function IcpAgent({ existingContext }: IcpAgentProps) {
  const hasExisting = Object.keys(existingContext).length > 0

  const WELCOME: Message = {
    role: 'assistant',
    content: hasExisting
      ? `Você já tem um contexto de marketing salvo. Posso **refinar o ICP existente** com base em novas informações ou gerar um completamente novo.\n\nO que prefere fazer?`
      : `Vamos construir o **ICP (Ideal Customer Profile)** do seu negócio.\n\nEsse perfil vai guiar toda a sua estratégia de conteúdo — do tom de voz aos hooks dos Reels.\n\nPrimeira pergunta: **o que você vende e para quem?** Seja específico — quanto mais detalhe agora, mais cirúrgico fica o ICP.`,
  }

  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedIdx, setSavedIdx] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  async function handleSend() {
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')
    setError(null)

    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setIsStreaming(true)
    setStreamingContent('')

    try {
      // Send only user/assistant pairs (skip welcome if it was synthetic)
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/ai/icp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })

      if (!res.ok) throw new Error(`Erro ${res.status}`)

      const reader = res.body?.getReader()
      if (!reader) throw new Error('Stream indisponível')

      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            if (parsed.text) { full += parsed.text; setStreamingContent(full) }
          } catch { /* ignore */ }
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: full }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsStreaming(false)
      setStreamingContent('')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  async function handleSave(draft: Record<string, unknown>, msgIdx: number) {
    setSaving(true)
    setError(null)
    const res = await saveMarketingContext(draft)
    setSaving(false)
    if (res.error) { setError(res.error); return }
    setSavedIdx(msgIdx)
  }

  function handleReset() {
    setMessages([WELCOME])
    setStreamingContent('')
    setError(null)
    setSavedIdx(null)
    setInput('')
    inputRef.current?.focus()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '760px', margin: '0 auto', padding: '0 24px' }}>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {messages.map((m, i) => {
          const draft = m.role === 'assistant' ? parseDraft(m.content) : null
          const displayContent = draft ? stripDraft(m.content) : m.content

          return (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  background: m.role === 'user' ? 'var(--bg-surface-raised)' : 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                }}>
                  {m.role === 'user' ? (
                    <p className="font-sans text-sm" style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{displayContent}</p>
                  ) : (
                    <div className="font-sans text-sm markdown-agent" style={{ color: 'var(--text-primary)' }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayContent}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>

              {/* ICP draft card */}
              {draft && (
                <IcpPreview
                  draft={draft}
                  onSave={() => handleSave(draft, i)}
                  saving={saving}
                  saved={savedIdx === i}
                />
              )}
            </div>
          )
        })}

        {/* Streaming */}
        {isStreaming && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ maxWidth: '85%', padding: '12px 16px', borderRadius: '12px 12px 12px 4px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              {streamingContent ? (
                <div className="font-sans text-sm markdown-agent" style={{ color: 'var(--text-primary)' }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{stripDraft(streamingContent)}</ReactMarkdown>
                  <span style={{ display: 'inline-block', width: '2px', height: '14px', background: 'var(--accent)', marginLeft: '2px', animation: 'cursor-blink 1s step-end infinite', verticalAlign: 'text-bottom' }} />
                </div>
              ) : (
                <span className={LABEL} style={{ color: 'var(--text-disabled)' }}>PENSANDO...</span>
              )}
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding: '10px 14px', background: 'var(--danger-subtle)', border: '1px solid var(--danger)', borderRadius: '8px' }}>
            <span className="font-sans text-xs" style={{ color: 'var(--danger)' }}>{error}</span>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '12px 0 20px', flexShrink: 0 }}>
        {messages.length > 1 && !isStreaming && (
          <button onClick={handleReset} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 8px 0' }}>
            <RefreshCw size={10} style={{ color: 'var(--text-disabled)' }} />
            <span className={LABEL} style={{ color: 'var(--text-disabled)' }}>RECOMEÇAR ENTREVISTA</span>
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-visible)', borderRadius: '10px', padding: '10px 12px' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Responda as perguntas do agente..."
            rows={1}
            disabled={isStreaming}
            className="font-sans text-sm"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', resize: 'none', color: 'var(--text-primary)', maxHeight: '120px', overflowY: 'auto', lineHeight: '1.5' }}
            onInput={e => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            style={{
              width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
              background: input.trim() && !isStreaming ? 'var(--accent)' : 'var(--border-visible)',
              border: 'none', cursor: input.trim() && !isStreaming ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 150ms ease-out',
            }}
          >
            <Send size={14} style={{ color: input.trim() && !isStreaming ? 'var(--bg-base)' : 'var(--text-disabled)' }} />
          </button>
        </div>
        <p className={LABEL} style={{ color: 'var(--text-disabled)', marginTop: '6px' }}>
          ENTER para enviar · SHIFT+ENTER para nova linha · diga "gera o ICP" quando estiver pronto
        </p>
      </div>
    </div>
  )
}
