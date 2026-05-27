'use client'

import { useState } from 'react'
import { createContentIdea, updateContentIdea, deleteContentIdea } from '../actions'

const FIELD_INPUT = {
  background: 'var(--bg-surface-raised)',
  border: '1px solid var(--border-visible)',
  borderRadius: '6px',
  padding: '7px 10px',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
  fontSize: '13px',
  width: '100%',
  outline: 'none',
}
const FIELD_LABEL = 'font-mono text-[9px] uppercase tracking-[0.08em]'

function FieldSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className={FIELD_LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...FIELD_INPUT, cursor: 'pointer' }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

interface Idea {
  id: string
  titulo: string
  tipo: string | null
  pilar: string | null
  objetivo: string | null
  status: string
  data_agendada: string | null
  palavra_isca: string | null
}

interface IdeaModalProps {
  idea: Idea | null
  marketingContext: Record<string, unknown>
  onClose: () => void
}

export function IdeaModal({ idea, marketingContext, onClose }: IdeaModalProps) {
  const [titulo, setTitulo] = useState(idea?.titulo ?? '')
  const [tipo, setTipo] = useState(idea?.tipo ?? 'reels')
  const [pilar, setPilar] = useState(idea?.pilar ?? 'educacional')
  const [objetivo, setObjetivo] = useState(idea?.objetivo ?? 'autoridade')
  const [palavraIsca, setPalavraIsca] = useState(idea?.palavra_isca ?? '')
  const [ofertaIsca, setOfertaIsca] = useState('')

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [aiSuggestions, setAiSuggestions] = useState<{
    hook_ideas: string[]
    cta_ideas: string[]
    roteiro_sugestao: string
    hashtags: string[]
    legenda: string
  } | null>(null)

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: { titulo, tipo, pilar, objetivo }, marketingContext }),
      })
      if (!res.ok) { setError('Erro ao gerar sugestões'); return }
      const json = await res.json()
      setAiSuggestions(json)
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave() {
    if (!titulo.trim()) { setError('Título obrigatório'); return }
    setSaving(true)
    setError(null)

    const payload = {
      titulo,
      tipo,
      pilar,
      objetivo,
      palavra_isca: palavraIsca || undefined,
      oferta_isca: ofertaIsca || undefined,
      hook_ideas: aiSuggestions?.hook_ideas,
      cta_ideas: aiSuggestions?.cta_ideas,
      roteiro_sugestao: aiSuggestions?.roteiro_sugestao,
      hashtags: aiSuggestions?.hashtags,
      legenda: aiSuggestions?.legenda,
    }

    const res = idea ? await updateContentIdea(idea.id, payload) : await createContentIdea(payload)
    if (res.error) { setError(res.error); setSaving(false); return }
    onClose()
  }

  async function handleDelete() {
    if (!idea) return
    setDeleting(true)
    await deleteContentIdea(idea.id)
    onClose()
  }

  const INPUT = FIELD_INPUT
  const LABEL = FIELD_LABEL

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '24px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-visible)', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className={LABEL} style={{ color: 'var(--text-secondary)' }}>{idea ? 'EDITAR IDEIA' : 'NOVA IDEIA'}</span>
          <button type="button" onClick={onClose} className={LABEL} style={{ background: 'none', border: 'none', color: 'var(--text-disabled)', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>TÍTULO</label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} style={INPUT} placeholder="Título da ideia de conteúdo" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <FieldSelect label="TIPO" value={tipo} options={['reels', 'carrossel', 'story']} onChange={setTipo} />
            <FieldSelect label="PILAR" value={pilar} options={['educacional', 'bastidores', 'prova_social', 'engajamento', 'promocional']} onChange={setPilar} />
            <FieldSelect label="OBJETIVO" value={objetivo} options={['isca', 'autoridade', 'viralizacao', 'conversao', 'educacao']} onChange={setObjetivo} />
          </div>

          {objetivo === 'isca' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '12px', background: 'var(--accent-subtle, rgba(99,102,241,0.08))', borderRadius: '8px', border: '1px solid var(--accent)' }}>
              <div>
                <label className={LABEL} style={{ color: 'var(--accent)', display: 'block', marginBottom: '5px' }}>PALAVRA ISCA</label>
                <input value={palavraIsca} onChange={e => setPalavraIsca(e.target.value)} style={INPUT} placeholder="Ex: planilha" />
              </div>
              <div>
                <label className={LABEL} style={{ color: 'var(--accent)', display: 'block', marginBottom: '5px' }}>OFERTA ISCA</label>
                <input value={ofertaIsca} onChange={e => setOfertaIsca(e.target.value)} style={INPUT} placeholder="O que enviar em DM?" />
              </div>
            </div>
          )}

          {/* AI Suggestions */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span className={LABEL} style={{ color: 'var(--text-secondary)' }}>SUGESTÕES DA IA</span>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || !titulo.trim()}
                className={LABEL}
                style={{
                  padding: '5px 12px',
                  background: generating ? 'var(--border-visible)' : 'var(--bg-surface-raised)',
                  border: '1px solid var(--border-visible)',
                  borderRadius: '5px',
                  color: generating ? 'var(--text-disabled)' : 'var(--text-secondary)',
                  cursor: generating || !titulo.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {generating ? 'Gerando...' : '✦ Gerar com IA'}
              </button>
            </div>

            {aiSuggestions && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {aiSuggestions.hook_ideas.length > 0 && (
                  <div>
                    <span className={LABEL} style={{ color: 'var(--text-disabled)', display: 'block', marginBottom: '4px' }}>HOOKS</span>
                    {aiSuggestions.hook_ideas.map((h, i) => (
                      <p key={i} className="font-sans text-xs" style={{ color: 'var(--text-secondary)', margin: '2px 0', paddingLeft: '8px', borderLeft: '2px solid var(--accent)' }}>{h}</p>
                    ))}
                  </div>
                )}
                {aiSuggestions.roteiro_sugestao && (
                  <div>
                    <span className={LABEL} style={{ color: 'var(--text-disabled)', display: 'block', marginBottom: '4px' }}>ROTEIRO</span>
                    <p className="font-sans text-xs" style={{ color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{aiSuggestions.roteiro_sugestao}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && <span className="font-mono text-[10px]" style={{ color: 'var(--danger)' }}>{error}</span>}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {idea ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className={LABEL}
              style={{ padding: '7px 12px', background: 'transparent', border: '1px solid var(--danger)', borderRadius: '6px', color: 'var(--danger)', cursor: 'pointer' }}
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </button>
          ) : <div />}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={LABEL}
            style={{
              padding: '7px 18px',
              background: saving ? 'var(--border-visible)' : 'var(--accent)',
              border: 'none',
              borderRadius: '6px',
              color: saving ? 'var(--text-disabled)' : 'var(--bg-base)',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
