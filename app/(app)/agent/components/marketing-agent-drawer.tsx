'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { AgentChat } from './agent-chat'
import type { MarketingAgentMode } from '@/lib/anthropic/agents/marketing-agent'

interface MarketingAgentDrawerProps {
  open: boolean
  onClose: () => void
  mode?: MarketingAgentMode
  title?: string
}

export function MarketingAgentDrawer({ open, onClose, mode = 'chat', title }: MarketingAgentDrawerProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 200,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 200ms ease-out',
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: '420px',
          background: 'var(--bg-base)',
          borderLeft: '1px solid var(--border-subtle)',
          zIndex: 201,
          display: 'flex', flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 200ms ease-out',
        }}
      >
        {/* Drawer header */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--text-secondary)' }}>
              {title ?? 'AGENTE DE MARKETING'}
            </span>
            <span style={{
              padding: '2px 6px',
              background: 'var(--accent-subtle)',
              border: '1px solid var(--accent-border)',
              borderRadius: '4px',
            }}>
              <span className="font-mono text-[9px] uppercase" style={{ color: 'var(--accent-text)' }}>IA</span>
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
          >
            <X size={15} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Chat */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {open && <AgentChat initialMode={mode} />}
        </div>
      </div>
    </>
  )
}
