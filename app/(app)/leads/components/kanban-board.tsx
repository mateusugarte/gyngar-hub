'use client'

import { useState, useEffect, useTransition } from 'react'
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { createClient } from '@/lib/supabase/client'
import { moveLeadAction } from '../actions'
import { KanbanColumn } from './kanban-column'
import { LeadModal } from './lead-modal'
import type { Lead } from './lead-card'

export const COLUMNS: { id: string; label: string; isRecusa?: boolean }[] = [
  { id: 'primeiro_contato', label: 'Contato Feito' },
  { id: 'possivel_interesse', label: 'Possível Interesse' },
  { id: 'reuniao_agendada', label: 'Reunião Agendada' },
  { id: 'venda_concluida', label: 'Venda Concluída' },
  { id: 'recusa', label: 'Recusa', isRecusa: true },
]

interface KanbanBoardProps {
  initialLeads: Lead[]
  userId: string
}

export function KanbanBoard({ initialLeads, userId }: KanbanBoardProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [isNewModal, setIsNewModal] = useState(false)
  const [, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads_qualified',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLeads((prev) => [...prev, payload.new as Lead])
          } else if (payload.eventType === 'UPDATE') {
            setLeads((prev) =>
              prev.map((l) => (l.id === (payload.new as Lead).id ? (payload.new as Lead) : l))
            )
          } else if (payload.eventType === 'DELETE') {
            setLeads((prev) => prev.filter((l) => l.id !== (payload.old as Lead).id))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const leadId = active.id as string
    const novaEtapa = over.id as string

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? { ...l, etapa: novaEtapa, alerta_parado: null }
          : l
      )
    )

    startTransition(async () => {
      const { error } = await moveLeadAction(leadId, novaEtapa)
      if (error) {
        // Revert on error
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId ? { ...l, etapa: active.data.current?.lead.etapa } : l
          )
        )
      }
    })
  }

  function handleSaved() {
    setEditingLead(null)
    setIsNewModal(false)
  }

  const leadsForColumn = (etapa: string) =>
    leads.filter((l) => l.etapa === etapa || (etapa === 'possivel_interesse' && l.etapa === 'follow_up'))

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div
          style={{
            display: 'flex',
            gap: '16px',
            overflowX: 'auto',
            paddingBottom: '16px',
            alignItems: 'flex-start',
          }}
        >
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              label={col.label}
              leads={leadsForColumn(col.id)}
              isRecusa={col.isRecusa}
              onEdit={setEditingLead}
            />
          ))}
        </div>
      </DndContext>

      {(editingLead || isNewModal) && (
        <LeadModal
          lead={editingLead}
          onClose={() => { setEditingLead(null); setIsNewModal(false) }}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}

// Export setter for new lead button in page
export type { KanbanBoardProps }
