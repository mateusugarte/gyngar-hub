'use client'

import { useActionState, useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Plus } from 'lucide-react'
import { saveLeadAction } from '../actions'
import type { Lead } from './lead-card'

const formSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  telefone: z.string().optional(),
  instagram: z.string().optional(),
  email: z.string().optional(),
  empresa: z.string().optional(),
  nicho: z.string().optional(),
  porte: z.string().optional(),
  cidade: z.string().optional(),
  site: z.string().optional(),
  etapa: z.string().default('primeiro_contato'),
  score: z.string().optional(),
  valor_potencial: z.string().optional(),
  observacoes: z.string().optional(),
  proxima_tipo: z.string().optional(),
  proxima_data: z.string().optional(),
  proxima_descricao: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyResolver = any

interface LeadModalProps {
  lead: Lead | null
  onClose: () => void
  onSaved: () => void
}

const INPUT_STYLE = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: '8px',
  background: 'var(--bg-base)',
  border: '1px solid var(--border-visible)',
  color: 'var(--text-primary)',
  fontSize: '13px',
  fontFamily: 'Space Grotesk, sans-serif',
  outline: 'none',
} as const

const LABEL_STYLE = {
  display: 'block',
  marginBottom: '4px',
  fontSize: '10px',
  fontFamily: 'Space Mono, monospace',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: 'var(--text-secondary)',
}

const ETAPA_OPTIONS = [
  { value: 'primeiro_contato', label: 'Contato Feito' },
  { value: 'possivel_interesse', label: 'Possível Interesse' },
  { value: 'reuniao_agendada', label: 'Reunião Agendada' },
  { value: 'venda_concluida', label: 'Venda Concluída' },
  { value: 'recusa', label: 'Recusa' },
]

export function LeadModal({ lead, onClose, onSaved }: LeadModalProps) {
  const [activeTab, setActiveTab] = useState<'dados' | 'pipeline'>('dados')
  const [tags, setTags] = useState<string[]>(lead?.tags ?? [])
  const [tagInput, setTagInput] = useState('')

  const [state, formAction, isPending] = useActionState(saveLeadAction, { error: null })

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as AnyResolver,
    defaultValues: {
      nome: lead?.nome ?? '',
      telefone: lead?.telefone ?? '',
      instagram: lead?.instagram ?? '',
      email: lead?.email ?? '',
      empresa: lead?.empresa ?? '',
      nicho: lead?.nicho ?? '',
      porte: lead?.porte ?? '',
      cidade: lead?.cidade ?? '',
      site: lead?.site ?? '',
      etapa: lead?.etapa ?? 'primeiro_contato',
      score: lead?.score ?? '',
      valor_potencial: lead?.valor_potencial?.toString() ?? '',
      observacoes: lead?.observacoes ?? '',
      proxima_tipo: lead?.proxima_acao?.tipo ?? '',
      proxima_data: lead?.proxima_acao?.data ?? '',
      proxima_descricao: lead?.proxima_acao?.descricao ?? '',
    },
  })

  function addTag() {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t])
    setTagInput('')
  }

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    const fd = new FormData()
    if (lead?.id) fd.append('id', lead.id)
    Object.entries(values).forEach(([k, v]) => { if (v) fd.append(k, v) })
    tags.forEach((t) => fd.append('tags', t))

    const proxima_acao = {
      tipo: values.proxima_tipo || undefined,
      data: values.proxima_data || undefined,
      descricao: values.proxima_descricao || undefined,
    }
    if (proxima_acao.tipo || proxima_acao.data) {
      fd.append('proxima_acao', JSON.stringify(proxima_acao))
    }

    formAction(fd)
  }

  // Close on success
  if (state.success) { onSaved(); return null }

  const TAB_STYLE = (active: boolean) => ({
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '11px',
    fontFamily: 'Space Mono, monospace',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    border: 'none',
    cursor: 'pointer',
    background: active ? 'var(--accent-subtle)' : 'transparent',
    color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
  })

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-visible)',
          borderRadius: '16px',
          width: '100%', maxWidth: '520px',
          maxHeight: '90vh', overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 0',
        }}>
          <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--text-secondary)' }}>
            {lead ? 'Editar Lead' : 'Novo Lead'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', padding: '12px 24px 0' }}>
          <button style={TAB_STYLE(activeTab === 'dados')} onClick={() => setActiveTab('dados')}>Dados</button>
          <button style={TAB_STYLE(activeTab === 'pipeline')} onClick={() => setActiveTab('pipeline')}>Pipeline</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '16px 24px 24px' }}>
          {/* TAB: DADOS */}
          {activeTab === 'dados' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={LABEL_STYLE}>Nome *</label>
                <input {...register('nome')} style={INPUT_STYLE} placeholder="Nome completo" />
                {errors.nome && <p style={{ color: 'var(--danger)', fontSize: '11px', marginTop: '4px' }}>{errors.nome.message}</p>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={LABEL_STYLE}>Telefone</label>
                  <input {...register('telefone')} style={INPUT_STYLE} placeholder="+55 11 99999-9999" />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Instagram</label>
                  <input {...register('instagram')} style={INPUT_STYLE} placeholder="@usuario" />
                </div>
              </div>
              <div>
                <label style={LABEL_STYLE}>Email</label>
                <input {...register('email')} style={INPUT_STYLE} type="email" placeholder="email@empresa.com" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={LABEL_STYLE}>Empresa</label>
                  <input {...register('empresa')} style={INPUT_STYLE} placeholder="Nome da empresa" />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Nicho</label>
                  <input {...register('nicho')} style={INPUT_STYLE} placeholder="Ex: Estética" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={LABEL_STYLE}>Porte</label>
                  <input {...register('porte')} style={INPUT_STYLE} placeholder="Pequena / Média..." />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Cidade</label>
                  <input {...register('cidade')} style={INPUT_STYLE} placeholder="São Paulo" />
                </div>
              </div>
              <div>
                <label style={LABEL_STYLE}>Site</label>
                <input {...register('site')} style={INPUT_STYLE} placeholder="https://..." />
              </div>
            </div>
          )}

          {/* TAB: PIPELINE */}
          {activeTab === 'pipeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={LABEL_STYLE}>Etapa</label>
                  <select {...register('etapa')} style={{ ...INPUT_STYLE, cursor: 'pointer' }}>
                    {ETAPA_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={LABEL_STYLE}>Score</label>
                  <select {...register('score')} style={{ ...INPUT_STYLE, cursor: 'pointer' }}>
                    <option value="">— Sem score</option>
                    <option value="A">A — Alto potencial</option>
                    <option value="B">B — Médio potencial</option>
                    <option value="C">C — Baixo potencial</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={LABEL_STYLE}>Valor potencial (R$)</label>
                <input {...register('valor_potencial')} style={INPUT_STYLE} type="number" step="0.01" placeholder="0,00" />
              </div>
              <div>
                <label style={LABEL_STYLE}>Observações</label>
                <textarea
                  {...register('observacoes')}
                  style={{ ...INPUT_STYLE, minHeight: '80px', resize: 'vertical' }}
                  placeholder="Notas sobre o lead..."
                />
              </div>

              {/* Próxima Ação */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                <p style={{ ...LABEL_STYLE, marginBottom: '10px' }}>Próxima Ação</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={LABEL_STYLE}>Tipo</label>
                    <select {...register('proxima_tipo')} style={{ ...INPUT_STYLE, cursor: 'pointer' }}>
                      <option value="">— Nenhum</option>
                      <option value="ligacao">Ligação</option>
                      <option value="mensagem">Mensagem</option>
                      <option value="reuniao">Reunião</option>
                      <option value="email">Email</option>
                    </select>
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>Data</label>
                    <input {...register('proxima_data')} style={INPUT_STYLE} type="date" />
                  </div>
                </div>
                <div>
                  <label style={LABEL_STYLE}>Descrição</label>
                  <input {...register('proxima_descricao')} style={INPUT_STYLE} placeholder="Ex: Enviar proposta" />
                </div>
              </div>

              {/* Tags */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                <p style={{ ...LABEL_STYLE, marginBottom: '8px' }}>Tags</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '3px 8px', borderRadius: '100px',
                        background: 'var(--accent-subtle)',
                        color: 'var(--accent-text)',
                        fontSize: '11px', fontFamily: 'Space Grotesk, sans-serif',
                      }}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}
                      >
                        <X size={10} style={{ color: 'var(--accent-text)' }} />
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                    style={{ ...INPUT_STYLE, flex: 1 }}
                    placeholder="Nova tag + Enter"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    style={{
                      background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)',
                      borderRadius: '8px', cursor: 'pointer', padding: '0 10px',
                    }}
                  >
                    <Plus size={14} style={{ color: 'var(--accent-text)' }} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {state.error && (
            <p style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '12px' }}>{state.error}</p>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
                fontFamily: 'Space Grotesk, sans-serif',
                background: 'none', border: '1px solid var(--border-visible)',
                color: 'var(--text-secondary)', cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              style={{
                padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
                fontFamily: 'Space Grotesk, sans-serif',
                background: 'var(--accent)', border: 'none',
                color: 'var(--bg-base)', cursor: isPending ? 'not-allowed' : 'pointer',
                opacity: isPending ? 0.7 : 1,
              }}
            >
              {isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
