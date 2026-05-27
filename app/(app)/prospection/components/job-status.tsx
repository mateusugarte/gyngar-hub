'use client'

import { useEffect, useState, useCallback } from 'react'

interface JobStatusProps {
  jobId: string
  onComplete: () => void
}

interface StatusData {
  status: 'rodando' | 'concluido' | 'erro'
  totalColetado?: number
  totalQualificados?: number
}

export function JobStatus({ jobId, onComplete }: JobStatusProps) {
  const [data, setData] = useState<StatusData>({ status: 'rodando' })
  const [dots, setDots] = useState('.')

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/prospection/status?jobId=${jobId}`)
      const json: StatusData = await res.json()
      setData(json)
      if (json.status === 'concluido' || json.status === 'erro') {
        onComplete()
      }
    } catch {
      // retry silently
    }
  }, [jobId, onComplete])

  useEffect(() => {
    const t0 = setTimeout(poll, 0)
    const interval = setInterval(poll, 8000)
    return () => { clearTimeout(t0); clearInterval(interval) }
  }, [poll])

  useEffect(() => {
    if (data.status !== 'rodando') return
    const t = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 600)
    return () => clearInterval(t)
  }, [data.status])

  const LABEL = 'font-mono text-[9px] uppercase tracking-[0.08em]'

  if (data.status === 'concluido') {
    return (
      <div style={{
        background: 'var(--success-subtle)',
        border: '1px solid var(--success)',
        borderRadius: '8px',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <span className={LABEL} style={{ color: 'var(--success)' }}>PROSPECÇÃO CONCLUÍDA</span>
        <div style={{ display: 'flex', gap: '24px' }}>
          <div>
            <span className="font-mono text-[20px] font-bold" style={{ color: 'var(--text-primary)' }}>
              {data.totalColetado ?? 0}
            </span>
            <span className={LABEL} style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>coletados</span>
          </div>
          <div>
            <span className="font-mono text-[20px] font-bold" style={{ color: 'var(--success)' }}>
              {data.totalQualificados ?? 0}
            </span>
            <span className={LABEL} style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>qualificados</span>
          </div>
        </div>
        <span className="font-sans text-xs" style={{ color: 'var(--text-secondary)' }}>
          Leads qualificados foram adicionados ao pipeline.
        </span>
      </div>
    )
  }

  if (data.status === 'erro') {
    return (
      <div style={{
        background: 'var(--danger-subtle)',
        border: '1px solid var(--danger)',
        borderRadius: '8px',
        padding: '16px 20px',
      }}>
        <span className={LABEL} style={{ color: 'var(--danger)' }}>ERRO NA PROSPECÇÃO</span>
        <p className="font-sans text-xs" style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
          Verifique sua chave Apify e tente novamente.
        </p>
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--bg-surface-raised)',
      border: '1px solid var(--border-visible)',
      borderRadius: '8px',
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
    }}>
      <div style={{
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: 'var(--accent)',
        animation: 'pulse-warn 1.5s infinite',
        flexShrink: 0,
      }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span className={LABEL} style={{ color: 'var(--accent)' }}>COLETANDO LEADS{dots}</span>
        <span className="font-sans text-xs" style={{ color: 'var(--text-secondary)' }}>
          Apify está rodando. Isso pode levar alguns minutos.
        </span>
      </div>
    </div>
  )
}
