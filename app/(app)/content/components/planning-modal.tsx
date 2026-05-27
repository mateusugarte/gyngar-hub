'use client'

import { useState, useRef } from 'react'

interface PlanningModalProps {
  marketingContext: Record<string, unknown>
  onClose: () => void
}

export function PlanningModal({ marketingContext, onClose }: PlanningModalProps) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const textareaRef = useRef<HTMLDivElement>(null)

  async function handleGenerate() {
    setLoading(true)
    setText('')
    setDone(false)

    try {
      const res = await fetch('/api/ai/planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketingContext }),
      })
      if (!res.body) { setLoading(false); return }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone) break
        const chunk = decoder.decode(value, { stream: true })
        setText(prev => {
          const next = prev + chunk
          // auto-scroll
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.scrollTop = textareaRef.current.scrollHeight
            }
          }, 0)
          return next
        })
      }
    } finally {
      setLoading(false)
      setDone(true)
    }
  }

  const LABEL = 'font-mono text-[9px] uppercase tracking-[0.08em]'

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: '24px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-visible)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className={LABEL} style={{ color: 'var(--text-secondary)' }}>AGENTE DE PLANEJAMENTO</span>
          <button type="button" onClick={onClose} className={LABEL} style={{ background: 'none', border: 'none', color: 'var(--text-disabled)', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '20px', gap: '16px' }}>
          {!text && !loading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p className="font-sans text-sm" style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                O agente vai criar um plano de conteúdo mensal personalizado baseado no seu contexto de marketing.
              </p>
              <button
                type="button"
                onClick={handleGenerate}
                className="font-mono text-[10px] uppercase"
                style={{
                  padding: '10px 24px',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'var(--bg-base)',
                  cursor: 'pointer',
                }}
              >
                Gerar Planejamento
              </button>
            </div>
          )}

          {(text || loading) && (
            <div
              ref={textareaRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                background: 'var(--bg-surface-raised)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '16px',
                fontFamily: 'inherit',
                fontSize: '13px',
                lineHeight: '1.7',
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {text}
              {loading && (
                <span style={{ display: 'inline-block', width: '8px', height: '14px', background: 'var(--accent)', animation: 'pulse-warn 0.8s infinite', marginLeft: '2px', verticalAlign: 'text-bottom' }} />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {done && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleGenerate}
              className="font-mono text-[10px] uppercase"
              style={{ padding: '7px 14px', background: 'transparent', border: '1px solid var(--border-visible)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              Gerar novamente
            </button>
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-[10px] uppercase"
              style={{ padding: '7px 14px', background: 'var(--success)', border: 'none', borderRadius: '6px', color: 'var(--bg-base)', cursor: 'pointer' }}
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
