'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { KanbanBoard } from './kanban-board'
import { LeadModal } from './lead-modal'
import type { Lead } from './lead-card'

interface LeadsClientProps {
  initialLeads: Lead[]
  userId: string
}

export function LeadsClient({ initialLeads, userId }: LeadsClientProps) {
  const [newModalOpen, setNewModalOpen] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button
          onClick={() => setNewModalOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '8px',
            background: 'var(--accent)', border: 'none',
            color: 'var(--bg-base)', cursor: 'pointer',
            fontSize: '13px', fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 500,
          }}
        >
          <Plus size={14} />
          Novo Lead
        </button>
      </div>

      <KanbanBoard initialLeads={initialLeads} userId={userId} />

      {newModalOpen && (
        <LeadModal
          lead={null}
          onClose={() => setNewModalOpen(false)}
          onSaved={() => setNewModalOpen(false)}
        />
      )}
    </div>
  )
}
