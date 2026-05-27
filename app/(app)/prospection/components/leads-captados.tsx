'use client'

import { useState } from 'react'

interface ScrapingJob {
  id: string
  fonte: string
  status: string
  total_coletado: number | null
  total_qualificados: number | null
  created_at: string
}

interface LeadCaptado {
  id: string
  nome: string | null
  instagram: string | null
  empresa: string | null
  nicho: string | null
  cidade: string | null
  score: string | null
  origem: string | null
  created_at: string
}

interface LeadsIg {
  id: string
  ig_username: string
  comentario: string | null
  data_captura: string
}

interface LeadsCaptadosProps {
  jobs: ScrapingJob[]
  leadsApi: LeadCaptado[]
  leadsIg: LeadsIg[]
}

const FONTE_LABEL: Record<string, string> = {
  ig_comentarios: 'Comentários IG',
  ig_seguidores: 'Seguidores IG',
  google_maps: 'Google Maps',
}

const SCORE_STYLE: Record<string, { bg: string; color: string }> = {
  A: { bg: 'var(--success-subtle)', color: 'var(--success)' },
  B: { bg: 'var(--warning-subtle)', color: 'var(--warning)' },
  C: { bg: 'var(--danger-subtle)', color: 'var(--danger)' },
}

type SubTab = 'api' | 'ig'

export function LeadsCaptados({ jobs, leadsApi, leadsIg }: LeadsCaptadosProps) {
  const [subTab, setSubTab] = useState<SubTab>('api')

  const LABEL = 'font-mono text-[9px] uppercase tracking-[0.08em]'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        {([['api', 'Via Apify'], ['ig', 'Leads Isca IG']] as [SubTab, string][]).map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            onClick={() => setSubTab(tab)}
            className={LABEL}
            style={{
              padding: '5px 12px',
              borderRadius: '5px',
              border: subTab === tab ? '1px solid var(--accent)' : '1px solid transparent',
              background: subTab === tab ? 'var(--accent)' : 'transparent',
              color: subTab === tab ? 'var(--bg-base)' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* API leads */}
      {subTab === 'api' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Jobs history */}
          {jobs.length > 0 && (
            <div>
              <span className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '10px' }}>
                HISTÓRICO DE JOBS
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {jobs.map(job => (
                  <div
                    key={job.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      background: 'var(--bg-surface-raised)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                    }}
                  >
                    <span className={LABEL} style={{ color: 'var(--text-secondary)', width: '120px', flexShrink: 0 }}>
                      {FONTE_LABEL[job.fonte] ?? job.fonte}
                    </span>
                    <span
                      className={LABEL}
                      style={{
                        color: job.status === 'concluido' ? 'var(--success)' : job.status === 'erro' ? 'var(--danger)' : 'var(--warning)',
                        width: '70px',
                        flexShrink: 0,
                      }}
                    >
                      {job.status}
                    </span>
                    <span className="font-sans text-xs" style={{ color: 'var(--text-secondary)', flex: 1 }}>
                      {job.total_coletado ?? 0} coletados · {job.total_qualificados ?? 0} qualificados
                    </span>
                    <span className="font-mono text-[9px]" style={{ color: 'var(--text-disabled)' }}>
                      {new Date(job.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leads table */}
          {leadsApi.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <span className={LABEL} style={{ color: 'var(--text-disabled)' }}>[SEM LEADS CAPTADOS VIA API]</span>
            </div>
          ) : (
            <div>
              <span className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '10px' }}>
                LEADS QUALIFICADOS — {leadsApi.length}
              </span>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      {['Nome', 'Instagram', 'Empresa', 'Nicho', 'Cidade', 'Score', 'Origem'].map(h => (
                        <th key={h} className={LABEL} style={{ color: 'var(--text-secondary)', textAlign: 'left', padding: '6px 10px', fontWeight: 'normal' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leadsApi.map(lead => (
                      <tr key={lead.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td className="font-sans text-sm" style={{ padding: '8px 10px', color: 'var(--text-primary)' }}>{lead.nome}</td>
                        <td className="font-mono text-[11px]" style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                          {lead.instagram ? `@${lead.instagram}` : '—'}
                        </td>
                        <td className="font-sans text-sm" style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>{lead.empresa ?? '—'}</td>
                        <td className="font-sans text-sm" style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>{lead.nicho ?? '—'}</td>
                        <td className="font-sans text-sm" style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>{lead.cidade ?? '—'}</td>
                        <td style={{ padding: '8px 10px' }}>
                          {lead.score ? (
                            <span
                              className={LABEL}
                              style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: SCORE_STYLE[lead.score]?.bg ?? 'transparent',
                                color: SCORE_STYLE[lead.score]?.color ?? 'var(--text-secondary)',
                              }}
                            >
                              {lead.score}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="font-mono text-[10px]" style={{ padding: '8px 10px', color: 'var(--text-disabled)' }}>
                          {lead.origem ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* IG leads */}
      {subTab === 'ig' && (
        leadsIg.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <span className={LABEL} style={{ color: 'var(--text-disabled)' }}>[SEM LEADS ISCA CAPTURADOS]</span>
          </div>
        ) : (
          <div>
            <span className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '10px' }}>
              LEADS ISCA — {leadsIg.length}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {leadsIg.map(lead => (
                <div
                  key={lead.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '10px 12px',
                    background: 'var(--bg-surface-raised)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                  }}
                >
                  <span className="font-mono text-[11px]" style={{ color: 'var(--accent)', flexShrink: 0, width: '140px' }}>
                    {`@${lead.ig_username}`}
                  </span>
                  <span className="font-sans text-xs" style={{ color: 'var(--text-secondary)', flex: 1, lineHeight: 1.5 }}>
                    {lead.comentario ?? '—'}
                  </span>
                  <span className="font-mono text-[9px]" style={{ color: 'var(--text-disabled)', flexShrink: 0 }}>
                    {new Date(lead.data_captura).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  )
}
