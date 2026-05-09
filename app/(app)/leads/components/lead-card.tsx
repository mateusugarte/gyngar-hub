'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, MoreHorizontal } from 'lucide-react'

export interface Lead {
  id: string
  nome: string | null
  empresa: string | null
  nicho: string | null
  origem: string | null
  score: string | null
  alerta_parado: string | null
  proxima_acao: { tipo?: string; data?: string; descricao?: string } | null
  etapa: string
  telefone?: string | null
  instagram?: string | null
  email?: string | null
  porte?: string | null
  cidade?: string | null
  site?: string | null
  valor_potencial?: number | null
  observacoes?: string | null
  tags?: string[]
  data_entrada_etapa?: string | null
}

const ORIGEM_LABELS: Record<string, string> = {
  instagram_comentario: 'IG Comentário',
  instagram_seguidor: 'IG Seguidor',
  google_maps: 'Google Maps',
  linkedin: 'LinkedIn',
  manual: 'Manual',
  indicacao: 'Indicação',
  post_isca: 'Post Isca',
}

const SCORE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: 'var(--success-subtle)', text: 'var(--success)', border: 'rgba(90,158,122,0.30)' },
  B: { bg: 'var(--warning-subtle)', text: 'var(--warning)', border: 'rgba(201,147,58,0.30)' },
  C: { bg: 'var(--danger-subtle)', text: 'var(--danger)', border: 'rgba(184,80,64,0.30)' },
}

interface LeadCardProps {
  lead: Lead
  onEdit: (lead: Lead) => void
}

export function LeadCard({ lead, onEdit }: LeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { lead },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  const scoreStyle = lead.score ? SCORE_STYLES[lead.score] : null
  const alertaAmarelo = lead.alerta_parado === 'amarelo'
  const alertaVermelho = lead.alerta_parado === 'vermelho'

  const proximaData = lead.proxima_acao?.data
    ? new Date(lead.proxima_acao.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    : null

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: 'var(--bg-surface)',
        border: alertaVermelho
          ? '1px solid var(--border-visible)'
          : alertaAmarelo
            ? '1px solid var(--border-visible)'
            : '1px solid var(--border-visible)',
        borderLeft: alertaVermelho
          ? '3px solid var(--danger)'
          : alertaAmarelo
            ? '3px solid var(--warning)'
            : '1px solid var(--border-visible)',
        borderRadius: '10px',
        padding: '12px',
        marginBottom: '8px',
        animation: alertaVermelho
          ? 'pulse-danger 1.2s infinite'
          : alertaAmarelo
            ? 'pulse-warn 2s infinite'
            : 'none',
        userSelect: 'none',
      }}
      {...listeners}
      {...attributes}
    >
      {/* Header: nome + menu */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            className="font-sans font-medium text-sm truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {lead.nome ?? '—'}
          </p>
          {lead.empresa && (
            <p className="font-sans text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
              {lead.empresa}
            </p>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(lead) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', flexShrink: 0 }}
          aria-label="Editar lead"
        >
          <MoreHorizontal size={14} style={{ color: 'var(--text-disabled)' }} />
        </button>
      </div>

      {/* Badges: origem + score */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
        {lead.origem && (
          <span
            className="font-mono text-[9px] uppercase tracking-[0.08em]"
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'var(--bg-surface-raised)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {ORIGEM_LABELS[lead.origem] ?? lead.origem}
          </span>
        )}
        {scoreStyle && (
          <span
            className="font-mono text-[9px] font-bold uppercase"
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              background: scoreStyle.bg,
              color: scoreStyle.text,
              border: `1px solid ${scoreStyle.border}`,
            }}
          >
            Score {lead.score}
          </span>
        )}
        {alertaAmarelo && (
          <span
            className="font-mono text-[9px] uppercase tracking-[0.08em]"
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'var(--warning-subtle)',
              color: 'var(--warning)',
            }}
          >
            Esfriando
          </span>
        )}
        {alertaVermelho && (
          <span
            className="font-mono text-[9px] uppercase tracking-[0.08em]"
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'var(--danger-subtle)',
              color: 'var(--danger)',
            }}
          >
            Perdendo
          </span>
        )}
      </div>

      {/* Nicho */}
      {lead.nicho && (
        <p className="font-sans text-xs" style={{ color: 'var(--text-disabled)', marginBottom: '4px' }}>
          {lead.nicho}
        </p>
      )}

      {/* Próxima ação */}
      {proximaData && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
          <Calendar size={10} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <span className="font-mono text-[10px]" style={{ color: 'var(--accent-text)' }}>
            {proximaData}
            {lead.proxima_acao?.tipo && ` · ${lead.proxima_acao.tipo}`}
          </span>
        </div>
      )}
    </div>
  )
}
