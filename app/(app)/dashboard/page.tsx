import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DateRangeFilter } from '../leads/components/date-range-filter'
import { getDateRange } from '../leads/lib/date-range'
import { MetricCard } from './components/metric-card'
import { ProgressBar } from './components/progress-bar'
import { FunnelChart } from './components/funnel-chart'
import { ProspectionAreaChart } from './components/prospection-area-chart'
import { EngagementBarChart } from './components/engagement-bar-chart'

interface DashboardPageProps {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>
}

function formatNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams
  const range = (params.range as 'semana' | 'mes' | 'personalizado') ?? 'semana'
  const { from, to } = getDateRange(range, params.from, params.to)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Chamar RPC com uma query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: metrics } = await (supabase as any).rpc('get_dashboard_metrics', {
    p_user_id: user.id,
    p_start: from.toISOString(),
    p_end: to.toISOString(),
  })

  const m = metrics as {
    pipeline: {
      leads_total: number; leads_ig: number; leads_google: number
      leads_score_ab: number; reunioes: number; vendas: number; desqualificados: number
    }
    metas: { reunioes_meta: number; vendas_meta: number; prospeccoes_meta: number }
    prospeccao: { prospeccoes_feitas: number }
    conteudo: { posts_feitos: number; leads_isca: number; impressoes: number; engajamento_medio: number }
  } | null

  const pipeline = m?.pipeline ?? { leads_total: 0, leads_ig: 0, leads_google: 0, leads_score_ab: 0, reunioes: 0, vendas: 0, desqualificados: 0 }
  const metas = m?.metas ?? { reunioes_meta: 8, vendas_meta: 4, prospeccoes_meta: 15 }
  const prospeccao = m?.prospeccao ?? { prospeccoes_feitas: 0 }
  const conteudo = m?.conteudo ?? { posts_feitos: 0, leads_isca: 0, impressoes: 0, engajamento_medio: 0 }

  // Dados dummy para gráfico de área (sem tabela de histórico ainda — placeholder)
  const areaData: { date: string; feitas: number; meta: number }[] = []

  // Dados dummy para engajamento por tipo (sem instagram_posts populados ainda)
  const engajamentoData = [
    { tipo: 'Isca', engajamento: 0 },
    { tipo: 'Educação', engajamento: 0 },
    { tipo: 'Viralização', engajamento: 0 },
  ]

  const SECTION = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '12px',
    padding: '20px',
  }

  const SECTION_LABEL = 'font-mono text-[9px] uppercase tracking-[0.1em]'

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--text-secondary)' }}>
          DASHBOARD
        </span>
        <DateRangeFilter current={range} from={params.from} to={params.to} />
      </div>

      {/* Zona 2 — Conteúdo */}
      <section style={SECTION}>
        <span className={SECTION_LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '16px' }}>
          CONTEÚDO
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <MetricCard
            label="Impressões"
            value={formatNum(conteudo.impressoes)}
            sub="posts no período"
          />
          <MetricCard
            label="Engajamento Médio"
            value={`${conteudo.engajamento_medio.toFixed(1)}%`}
            sub="ref: >3% = bom"
          />
          <MetricCard
            label="Leads Isca"
            value={conteudo.leads_isca}
            sub="captados via posts isca"
            accent
          />
          <MetricCard
            label="Posts Feitos"
            value={conteudo.posts_feitos}
            sub="publicados no período"
          />
          <MetricCard
            label="Posts Previstos"
            value="—"
            sub="calendário (Etapa 2)"
          />
          <MetricCard
            label="Leads Qualificados"
            value={pipeline.leads_score_ab}
            sub="score A ou B"
          />
        </div>
      </section>

      {/* Zona 3 — Prospecção */}
      <section style={SECTION}>
        <span className={SECTION_LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '16px' }}>
          PROSPECÇÃO
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <MetricCard
            label="Pré-Qualificados"
            value={pipeline.leads_total}
            sub="total no período"
          />
          <MetricCard
            label="Leads Instagram"
            value={pipeline.leads_ig}
            sub="via posts isca"
          />
          <MetricCard
            label="Leads Google"
            value={pipeline.leads_google}
            sub="via Maps"
          />
          <MetricCard
            label="Desqualificados"
            value={pipeline.desqualificados}
            sub="etapa recusa"
          />
          <MetricCard
            label="Prospecções Feitas"
            value={prospeccao.prospeccoes_feitas}
            sub="jobs concluídos"
          />
          <MetricCard
            label="Meta Hoje"
            value={`${prospeccao.prospeccoes_feitas}/${metas.prospeccoes_meta}`}
            accent
          >
            <ProgressBar value={prospeccao.prospeccoes_feitas} max={metas.prospeccoes_meta} />
          </MetricCard>
        </div>
      </section>

      {/* Zona 4 — Metas + Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px' }}>

        {/* Metas */}
        <section style={SECTION}>
          <span className={SECTION_LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '16px' }}>
            METAS DO PERÍODO
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="font-sans text-sm" style={{ color: 'var(--text-primary)' }}>Reuniões Agendadas</span>
              </div>
              <ProgressBar value={pipeline.reunioes} max={metas.reunioes_meta} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="font-sans text-sm" style={{ color: 'var(--text-primary)' }}>Vendas Concluídas</span>
              </div>
              <ProgressBar value={pipeline.vendas} max={metas.vendas_meta} color="var(--success)" />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="font-sans text-sm" style={{ color: 'var(--text-primary)' }}>Prospecções</span>
              </div>
              <ProgressBar value={prospeccao.prospeccoes_feitas} max={metas.prospeccoes_meta} color="var(--warning)" />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="font-sans text-sm" style={{ color: 'var(--text-primary)' }}>Leads Isca</span>
              </div>
              <ProgressBar value={conteudo.leads_isca} max={10} color="var(--accent)" />
            </div>
          </div>
        </section>

        {/* Gráficos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Funil */}
          <section style={SECTION}>
            <span className={SECTION_LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '14px' }}>
              FUNIL DE CONVERSÃO
            </span>
            <FunnelChart
              impressoes={conteudo.impressoes}
              leads={pipeline.leads_total}
              reunioes={pipeline.reunioes}
              vendas={pipeline.vendas}
            />
          </section>

          {/* Prospecções vs meta */}
          <section style={SECTION}>
            <span className={SECTION_LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              PROSPECÇÕES VS META
            </span>
            <Suspense fallback={
              <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="font-mono text-[9px] uppercase" style={{ color: 'var(--text-disabled)' }}>[CARREGANDO...]</span>
              </div>
            }>
              <ProspectionAreaChart data={areaData} meta={metas.prospeccoes_meta} />
            </Suspense>
          </section>

          {/* Engajamento por tipo */}
          <section style={SECTION}>
            <span className={SECTION_LABEL} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '14px' }}>
              ENGAJAMENTO POR TIPO DE POST
            </span>
            <EngagementBarChart data={engajamentoData} />
          </section>
        </div>
      </div>
    </div>
  )
}
