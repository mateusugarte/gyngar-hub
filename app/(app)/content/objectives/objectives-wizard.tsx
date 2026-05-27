'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveMarketingContext } from '../actions'

interface ObjectivesWizardProps {
  initialContext: Record<string, unknown>
}

const STEPS = ['Produto', 'Diferencial', 'ICP Firmográfico', 'ICP Psicográfico', 'Persona', 'Voz da Marca', 'Prova Social']

const ADJETIVOS = ['Profissional', 'Descontraído', 'Direto', 'Empático', 'Espirituoso', 'Autoritário', 'Próximo', 'Técnico', 'Inspirador']
const JTBD = ['Educar', 'Entreter', 'Inspirar', 'Vender', 'Autoridade']
const SEGMENTOS = ['Saúde', 'Jurídico', 'Educação', 'E-commerce', 'Serviços', 'Tecnologia', 'Outro']
const PORTES = ['MEI', 'Pequena', 'Média', 'Grande empresa']
const GATILHOS = ['Crescimento acelerado', 'Falta de tempo', 'Perda de clientes', 'Recomendação', 'Problema urgente']
const USA_HOJE = ['Planilha', 'Processo manual', 'Concorrente direto', 'Nada', 'Outro']
const CATEGORIAS = ['Serviço', 'Produto físico', 'Produto digital', 'SaaS', 'Consultoria', 'Outro']
const MODELOS = ['Recorrente', 'Avulso', 'Projeto', 'Misto']

export function ObjectivesWizard({ initialContext }: ObjectivesWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ic = initialContext as any

  // Step 1
  const [produto, setProduto] = useState<string>(ic.produto?.descricao ?? '')
  const [categoria, setCategoria] = useState<string>(ic.produto?.categoria ?? '')
  const [modelo, setModelo] = useState<string>(ic.produto?.modelo ?? '')

  // Step 2 — Diferencial
  const [proposta, setProposta] = useState<string>(ic.diferencial?.proposta ?? '')
  const [diferenciais, setDiferenciais] = useState<string>(ic.diferencial?.diferenciais ?? '')
  const [concorrentes, setConcorrentes] = useState<string>(ic.diferencial?.concorrentes ?? '')

  // Step 3
  const [portes, setPortes] = useState<string[]>(ic.icp_firmografico?.portes ?? [])
  const [segmentos, setSegmentos] = useState<string[]>(ic.icp_firmografico?.segmentos ?? [])
  const [cidades, setCidades] = useState<string>(ic.icp_firmografico?.cidades?.join(', ') ?? '')

  // Step 4
  const [dor, setDor] = useState<string>(ic.icp_psicografico?.dor ?? '')
  const [gatilho, setGatilho] = useState<string>(ic.icp_psicografico?.gatilho ?? '')
  const [usaHoje, setUsaHoje] = useState<string[]>(ic.icp_psicografico?.usa_hoje ?? [])

  // Step 5 — Persona
  const [personaNome, setPersonaNome] = useState<string>(ic.persona?.nome ?? '')
  const [personaCargo, setPersonaCargo] = useState<string>(ic.persona?.cargo ?? '')
  const [personaFaixaEtaria, setPersonaFaixaEtaria] = useState<string>(ic.persona?.faixa_etaria ?? '')
  const [personaObjetivo, setPersonaObjetivo] = useState<string>(ic.persona?.objetivo ?? '')
  const [personaMedo, setPersonaMedo] = useState<string>(ic.persona?.medo ?? '')

  // Step 6
  const [adjetivos, setAdjetivos] = useState<string[]>(ic.voz_marca?.adjetivos ?? [])
  const [jtbd, setJtbd] = useState<string>(ic.voz_marca?.jtbd ?? '')

  // Step 7
  const [resultados, setResultados] = useState<string>(ic.prova_social?.resultados ?? '')
  const [nClientes, setNClientes] = useState<string>(String(ic.prova_social?.n_clientes ?? ''))
  const [testemunho, setTestemunho] = useState<string>(ic.prova_social?.testemunho ?? '')

  function toggleMulti(arr: string[], setArr: (v: string[]) => void, val: string, max?: number) {
    if (arr.includes(val)) setArr(arr.filter(x => x !== val))
    else if (!max || arr.length < max) setArr([...arr, val])
  }

  async function handleFinish() {
    setSaving(true)
    setError(null)
    const context = {
      produto: { descricao: produto, categoria, modelo },
      diferencial: { proposta, diferenciais, concorrentes },
      icp_firmografico: { portes, segmentos, cidades: cidades.split(',').map(s => s.trim()).filter(Boolean) },
      icp_psicografico: { dor, gatilho, usa_hoje: usaHoje },
      persona: { nome: personaNome, cargo: personaCargo, faixa_etaria: personaFaixaEtaria, objetivo: personaObjetivo, medo: personaMedo },
      voz_marca: { adjetivos, jtbd },
      prova_social: { resultados, n_clientes: parseInt(nClientes) || 0, testemunho },
    }
    const res = await saveMarketingContext(context)
    if (res.error) { setError(res.error); setSaving(false); return }
    router.push('/content')
  }

  const SECTION = { display: 'flex', flexDirection: 'column' as const, gap: '16px' }
  const INPUT = {
    background: 'var(--bg-surface-raised)',
    border: '1px solid var(--border-visible)',
    borderRadius: '6px',
    padding: '8px 10px',
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
    fontSize: '13px',
    width: '100%',
    outline: 'none',
  }
  const LABEL = 'font-mono text-[9px] uppercase tracking-[0.08em]'

  function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="font-sans text-xs"
        style={{
          padding: '5px 12px',
          borderRadius: '20px',
          border: selected ? '1px solid var(--accent)' : '1px solid var(--border-visible)',
          background: selected ? 'var(--accent)' : 'var(--bg-surface-raised)',
          color: selected ? 'var(--bg-base)' : 'var(--text-secondary)',
          cursor: 'pointer',
          transition: 'all 150ms',
        }}
      >
        {label}
      </button>
    )
  }

  return (
    <div style={{ padding: '32px', maxWidth: '640px', margin: '0 auto' }}>
      {/* Progress */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--text-secondary)' }}>
            OBJETIVOS DE MARKETING
          </span>
          <span className="font-mono text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            {step + 1}/{STEPS.length}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {STEPS.map((s, i) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: '3px',
                borderRadius: '2px',
                background: i <= step ? 'var(--accent)' : 'var(--border-visible)',
                transition: 'background 300ms',
              }}
            />
          ))}
        </div>
        <span className="font-sans text-sm" style={{ color: 'var(--text-primary)', display: 'block', marginTop: '12px', fontWeight: 500 }}>
          {STEPS[step]}
        </span>
      </div>

      {/* Step 1 — Produto */}
      {step === 0 && (
        <div style={SECTION}>
          <div>
            <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>O QUE VOCÊ VENDE?</label>
            <textarea value={produto} onChange={e => setProduto(e.target.value)} maxLength={100} rows={2} style={{ ...INPUT, resize: 'none' }} placeholder="Ex: Consultoria de marketing digital para clínicas" />
          </div>
          <div>
            <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>CATEGORIA</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {CATEGORIAS.map(c => <Chip key={c} label={c} selected={categoria === c} onClick={() => setCategoria(c)} />)}
            </div>
          </div>
          <div>
            <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>MODELO DE VENDA</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {MODELOS.map(m => <Chip key={m} label={m} selected={modelo === m} onClick={() => setModelo(m)} />)}
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — Diferencial */}
      {step === 1 && (
        <div style={SECTION}>
          <div>
            <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>PROPOSTA DE VALOR</label>
            <textarea value={proposta} onChange={e => setProposta(e.target.value)} maxLength={150} rows={2} style={{ ...INPUT, resize: 'none' }} placeholder="Ex: Ajudo clínicas a lotar a agenda sem depender de indicação, usando apenas o Instagram" />
          </div>
          <div>
            <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>DIFERENCIAIS (o que te torna único)</label>
            <textarea value={diferenciais} onChange={e => setDiferenciais(e.target.value)} maxLength={200} rows={3} style={{ ...INPUT, resize: 'none' }} placeholder="Ex: Método próprio de 3 etapas, atendimento personalizado, foco exclusivo em saúde" />
          </div>
          <div>
            <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>PRINCIPAIS CONCORRENTES / ALTERNATIVAS</label>
            <input value={concorrentes} onChange={e => setConcorrentes(e.target.value)} style={INPUT} placeholder="Ex: Agências generalistas, freelancers, fazer por conta própria" />
          </div>
        </div>
      )}

      {/* Step 3 — ICP Firmográfico */}
      {step === 2 && (
        <div style={SECTION}>
          <div>
            <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>PORTE DO CLIENTE IDEAL</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {PORTES.map(p => <Chip key={p} label={p} selected={portes.includes(p)} onClick={() => toggleMulti(portes, setPortes, p)} />)}
            </div>
          </div>
          <div>
            <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>SEGMENTO</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {SEGMENTOS.map(s => <Chip key={s} label={s} selected={segmentos.includes(s)} onClick={() => toggleMulti(segmentos, setSegmentos, s)} />)}
            </div>
          </div>
          <div>
            <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>CIDADES / REGIÕES ALVO</label>
            <input value={cidades} onChange={e => setCidades(e.target.value)} style={INPUT} placeholder="São Paulo, Rio de Janeiro, Curitiba" />
          </div>
        </div>
      )}

      {/* Step 4 — ICP Psicográfico */}
      {step === 3 && (
        <div style={SECTION}>
          <div>
            <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>PRINCIPAL DOR DO CLIENTE</label>
            <textarea value={dor} onChange={e => setDor(e.target.value)} maxLength={200} rows={3} style={{ ...INPUT, resize: 'none' }} placeholder="Ex: Perde tempo gerenciando redes sociais sem resultado" />
          </div>
          <div>
            <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>GATILHO DE COMPRA</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {GATILHOS.map(g => <Chip key={g} label={g} selected={gatilho === g} onClick={() => setGatilho(g)} />)}
            </div>
          </div>
          <div>
            <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>O QUE ELE USA ANTES DE VOCÊ</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {USA_HOJE.map(u => <Chip key={u} label={u} selected={usaHoje.includes(u)} onClick={() => toggleMulti(usaHoje, setUsaHoje, u)} />)}
            </div>
          </div>
        </div>
      )}

      {/* Step 5 — Persona */}
      {step === 4 && (
        <div style={SECTION}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>NOME DA PERSONA</label>
              <input value={personaNome} onChange={e => setPersonaNome(e.target.value)} style={INPUT} placeholder="Ex: Dr. Rafael" />
            </div>
            <div>
              <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>CARGO / FUNÇÃO</label>
              <input value={personaCargo} onChange={e => setPersonaCargo(e.target.value)} style={INPUT} placeholder="Ex: Médico proprietário de clínica" />
            </div>
          </div>
          <div>
            <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>FAIXA ETÁRIA</label>
            <input value={personaFaixaEtaria} onChange={e => setPersonaFaixaEtaria(e.target.value)} style={INPUT} placeholder="Ex: 35-50 anos" />
          </div>
          <div>
            <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>MAIOR OBJETIVO PROFISSIONAL</label>
            <textarea value={personaObjetivo} onChange={e => setPersonaObjetivo(e.target.value)} maxLength={150} rows={2} style={{ ...INPUT, resize: 'none' }} placeholder="Ex: Aumentar faturamento sem trabalhar mais horas" />
          </div>
          <div>
            <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>MAIOR MEDO / OBJEÇÃO</label>
            <textarea value={personaMedo} onChange={e => setPersonaMedo(e.target.value)} maxLength={150} rows={2} style={{ ...INPUT, resize: 'none' }} placeholder="Ex: Investir em marketing e não ver retorno" />
          </div>
        </div>
      )}

      {/* Step 6 — Voz da Marca */}
      {step === 5 && (
        <div style={SECTION}>
          <div>
            <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>ADJETIVOS DA MARCA (máx. 5)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {ADJETIVOS.map(a => <Chip key={a} label={a} selected={adjetivos.includes(a)} onClick={() => toggleMulti(adjetivos, setAdjetivos, a, 5)} />)}
            </div>
          </div>
          <div>
            <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>JTBD DO CONTEÚDO</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {JTBD.map(j => <Chip key={j} label={j} selected={jtbd === j} onClick={() => setJtbd(j)} />)}
            </div>
          </div>
        </div>
      )}

      {/* Step 7 — Prova Social */}
      {step === 6 && (
        <div style={SECTION}>
          <div>
            <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>PRINCIPAIS RESULTADOS</label>
            <textarea value={resultados} onChange={e => setResultados(e.target.value)} rows={3} style={{ ...INPUT, resize: 'none' }} placeholder="Ex: Ajudei 50 clínicas a dobrarem o agendamento em 90 dias" />
          </div>
          <div>
            <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>NÚMERO DE CLIENTES ATENDIDOS</label>
            <input type="number" value={nClientes} onChange={e => setNClientes(e.target.value)} style={INPUT} placeholder="50" />
          </div>
          <div>
            <label className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>TESTEMUNHO FAVORITO</label>
            <textarea value={testemunho} onChange={e => setTestemunho(e.target.value)} rows={4} style={{ ...INPUT, resize: 'vertical' }} placeholder="Cole aqui o testemunho que melhor representa seus resultados" />
          </div>
        </div>
      )}

      {error && (
        <span className="font-mono text-[10px]" style={{ color: 'var(--danger)', display: 'block', marginTop: '12px' }}>{error}</span>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
        <button
          type="button"
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
          className="font-mono text-[10px] uppercase"
          style={{
            padding: '8px 18px',
            background: 'transparent',
            border: '1px solid var(--border-visible)',
            borderRadius: '6px',
            color: step === 0 ? 'var(--text-disabled)' : 'var(--text-secondary)',
            cursor: step === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          ← Anterior
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep(s => s + 1)}
            className="font-mono text-[10px] uppercase"
            style={{
              padding: '8px 18px',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: '6px',
              color: 'var(--bg-base)',
              cursor: 'pointer',
            }}
          >
            Próximo →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            disabled={saving}
            className="font-mono text-[10px] uppercase"
            style={{
              padding: '8px 18px',
              background: saving ? 'var(--border-visible)' : 'var(--success)',
              border: 'none',
              borderRadius: '6px',
              color: saving ? 'var(--text-disabled)' : 'var(--bg-base)',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Salvando...' : 'Concluir'}
          </button>
        )}
      </div>
    </div>
  )
}
