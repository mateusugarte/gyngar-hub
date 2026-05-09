'use client'

import { useDroppable } from '@dnd-kit/core'
import { LeadCard, type Lead } from './lead-card'

interface KanbanColumnProps {
  id: string
  label: string
  leads: Lead[]
  isRecusa?: boolean
  onEdit: (lead: Lead) => void
}

export function KanbanColumn({ id, label, leads, isRecusa = false, onEdit }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '240px',
        flexShrink: 0,
        opacity: isRecusa ? 0.55 : 1,
      }}
    >
      {/* Column header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          padding: '0 2px',
        }}
      >
        <span
          className="font-mono text-[10px] uppercase tracking-[0.1em]"
          style={{ color: isRecusa ? 'var(--text-disabled)' : 'var(--text-secondary)' }}
        >
          {label}
        </span>
        <span
          className="font-mono text-[10px]"
          style={{
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'var(--bg-surface-raised)',
            color: 'var(--text-disabled)',
          }}
        >
          {leads.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          minHeight: '120px',
          padding: '8px',
          borderRadius: '10px',
          background: isOver
            ? 'var(--accent-subtle)'
            : isRecusa
              ? 'var(--bg-surface-raised)'
              : 'var(--bg-surface)',
          border: isOver
            ? '1px dashed var(--accent-border)'
            : '1px solid var(--border-subtle)',
          transition: 'background 150ms ease-out, border-color 150ms ease-out',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 200px)',
        }}
      >
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onEdit={onEdit} />
        ))}
        {leads.length === 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '80px',
            }}
          >
            <span
              className="font-mono text-[9px] uppercase tracking-[0.1em]"
              style={{ color: 'var(--text-disabled)' }}
            >
              [VAZIO]
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
