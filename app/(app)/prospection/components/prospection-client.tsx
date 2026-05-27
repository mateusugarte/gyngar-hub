'use client'

import { useState, useCallback } from 'react'
import { CaptureForm } from './capture-form'
import { JobStatus } from './job-status'

type Tab = 'captar' | 'captados'

interface ProspectionClientProps {
  captadosContent: React.ReactNode
  hasApifyKey: boolean
}

export function ProspectionClient({ captadosContent, hasApifyKey }: ProspectionClientProps) {
  const [tab, setTab] = useState<Tab>('captar')
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [jobComplete, setJobComplete] = useState(false)

  const handleJobStarted = useCallback((jobId: string) => {
    setActiveJobId(jobId)
    setJobComplete(false)
  }, [])

  const handleJobComplete = useCallback(() => {
    setJobComplete(true)
  }, [])

  const LABEL = 'font-mono text-[9px] uppercase tracking-[0.08em]'
  const SECTION = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '12px',
    padding: '20px',
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--text-secondary)' }}>
          PROSPECÇÃO
        </span>
      </div>

      {/* Apify key missing banner */}
      {!hasApifyKey && (
        <div style={{
          background: 'var(--warning-subtle)',
          border: '1px solid var(--warning)',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span className={LABEL} style={{ color: 'var(--warning)' }}>CHAVE APIFY AUSENTE</span>
          <span className="font-sans text-xs" style={{ color: 'var(--text-secondary)' }}>
            Configure sua chave Apify em Configurações para usar este módulo.
          </span>
        </div>
      )}

      {/* Main tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0' }}>
        {([['captar', 'Captar Leads'], ['captados', 'Leads Captados']] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={LABEL}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              background: 'transparent',
              color: tab === t ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'color 150ms',
              marginBottom: '-1px',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Captar tab */}
      {tab === 'captar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <section style={SECTION}>
            <span className={LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '16px' }}>
              CONFIGURAR PROSPECÇÃO
            </span>
            {hasApifyKey ? (
              <CaptureForm onJobStarted={handleJobStarted} />
            ) : (
              <span className="font-sans text-sm" style={{ color: 'var(--text-disabled)' }}>
                Configure a chave Apify primeiro.
              </span>
            )}
          </section>

          {activeJobId && (
            <JobStatus
              key={activeJobId}
              jobId={activeJobId}
              onComplete={handleJobComplete}
            />
          )}

          {jobComplete && (
            <button
              type="button"
              onClick={() => setTab('captados')}
              className={LABEL}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                border: '1px solid var(--border-visible)',
                borderRadius: '6px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                alignSelf: 'flex-start',
              }}
            >
              Ver Leads Captados →
            </button>
          )}
        </div>
      )}

      {/* Captados tab */}
      {tab === 'captados' && (
        <section style={SECTION}>
          {captadosContent}
        </section>
      )}
    </div>
  )
}
