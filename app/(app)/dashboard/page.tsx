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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [metricsRes, bestPostRes, engPostsRes, jobsRes] = await Promise.all([
    (supabase as any).rpc('get_dashboard_metrics', {
      p_user_id: user.id,
      p_start: from.toISOString(),
      p_end: to.toISOString(),
    }),
    supabase
      .from('instagram_posts')
      .select('ig_media_id,caption,likes,comments_count,saved,impressions,reach,media_url,thumbnail_url,permalink,tipo,data_publicacao')
      .eq('user_id', user.id)
      .order('likes', { ascending: false })
      .limit(5),
    // Engajamento por tipo — todos os posts do período com reach > 0
    supabase
      .from('instagram_posts')
      .select('tipo,likes,comments_count,saved,reach')
      .eq('user_id', user.id)
      .gte('data_publicacao', from.toISOString())
      .lte('data_publicacao', to.toISOString())
      .gt('reach', 0),
    // Jobs concluídos por dia no período
    supabase
      .from('scraping_jobs')
      .select('updated_at')
      .eq('user_id', user.id)
      .eq('status', 'concluido')
      .gte('updated_at', from.toISOString())
      .lte('updated_at', to.toISOString()),
  ])
  const { data: metrics } = metricsRes
  const rawBestPosts = (bestPostRes.data ?? []) as Array<{
    ig_media_id: string
    caption: string | null
    likes: number
    comments_count: number
    saved: number
    impressions: number
    reach: number
    media_url: string | null
    thumbnail_url: string | null
    permalink: string | null
    tipo: string | null
    data_publicacao: string | null
  }>
  // Ordena pelo engajamento total (likes + comments + saved) e pega o primeiro
  const bestPost = rawBestPosts
    .sort((a, b) => (b.likes + b.comments_count + b.saved) - (a.likes + a.comments_count + a.saved))[0] ?? null

  const m = metrics as {
    pipeline: {
      leads_total: number; leads_ig: number; leads_google: number
      leads_score_ab: number; reunioes: number; vendas: number; desqualificados: number
    }
    metas: { reunioes_meta: number; vendas_meta: number; prospeccoes_meta: number }
    prospeccao: { prospeccoes_feitas: number }
    conteudo: {
      posts_feitos: number; leads_isca: number; alcance: number
      curtidas: number; comentarios: number; salvos: number; engajamento_medio: number
    }
  } | null

  const pipeline = m?.pipeline ?? { leads_total: 0, leads_ig: 0, leads_google: 0, leads_score_ab: 0, reunioes: 0, vendas: 0, desqualificados: 0 }
  const metas = m?.metas ?? { reunioes_meta: 8, vendas_meta: 4, prospeccoes_meta: 15 }
  const prospeccao = m?.prospeccao ?? { prospeccoes_feitas: 0 }
  const conteudo = m?.conteudo ?? { posts_feitos: 0, leads_isca: 0, alcance: 0, curtidas: 0, comentarios: 0, salvos: 0, engajamento_medio: 0 }

  // Engajamento médio por tipo de post (REEL / IMAGE / CAROUSEL_ALBUM)
  const TIPO_LABEL: Record<string, string> = {
    REEL: 'Reel',
    IMAGE: 'Imagem',
    CAROUSEL_ALBUM: 'Carrossel',
  }
  const engByTipo = new Map<string, { sum: number; count: number }>()
  for (const p of (engPostsRes.data ?? [])) {
    const key = p.tipo ?? 'Outro'
    const eng = ((p.likes ?? 0) + (p.comments_count ?? 0) + (p.saved ?? 0)) / (p.reach ?? 1) * 100
    const cur = engByTipo.get(key) ?? { sum: 0, count: 0 }
    engByTipo.set(key, { sum: cur.sum + eng, count: cur.count + 1 })
  }
  const engajamentoData = Array.from(engByTipo.entries())
    .map(([tipo, { sum, count }]) => ({ tipo: TIPO_LABEL[tipo] ?? tipo, engajamento: sum / count }))
    .sort((a, b) => b.engajamento - a.engajamento)

  // Prospecções concluídas por dia no período
  const jobsByDay = new Map<string, number>()
  for (const job of (jobsRes.data ?? [])) {
    const day = job.updated_at.slice(0, 10) // 'YYYY-MM-DD'
    jobsByDay.set(day, (jobsByDay.get(day) ?? 0) + 1)
  }
  // Gera todos os dias do range para preencher zeros onde não há jobs
  const areaData: { date: string; feitas: number; meta: number }[] = []
  const cur = new Date(from)
  while (cur <= to) {
    const key = cur.toISOString().slice(0, 10)
    const label = `${String(cur.getDate()).padStart(2, '0')}/${String(cur.getMonth() + 1).padStart(2, '0')}`
    areaData.push({ date: label, feitas: jobsByDay.get(key) ?? 0, meta: metas.prospeccoes_meta })
    cur.setDate(cur.getDate() + 1)
  }

  const SECTION = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '12px',
    padding: '20px',
  }

  const SECTION_LABEL = 'font-mono text-[9px] uppercase tracking-[0.1em]'

  return (
    <div className="anim-page" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

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
            label="Alcance"
            value={formatNum(conteudo.alcance)}
            sub="contas únicas alcançadas"
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
            label="Curtidas"
            value={formatNum(conteudo.curtidas)}
            sub="no período"
          />
          <MetricCard
            label="Comentários"
            value={formatNum(conteudo.comentarios)}
            sub="no período"
          />
          <MetricCard
            label="Salvos"
            value={formatNum(conteudo.salvos)}
            sub="no período"
          />
          <MetricCard
            label="Posts Publicados"
            value={conteudo.posts_feitos}
            sub="no período"
          />
          <MetricCard
            label="Leads Qualificados"
            value={pipeline.leads_score_ab}
            sub="score A ou B"
          />
        </div>

        {/* Melhor post */}
        {bestPost && (
          <div style={{
            marginTop: '16px',
            padding: '14px 16px',
            background: 'var(--bg-surface-raised)',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            gap: '16px',
            alignItems: 'flex-start',
          }}>
            {(bestPost.media_url || bestPost.thumbnail_url) && (
              <div style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-base)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={(bestPost.thumbnail_url ?? bestPost.media_url)!}
                  alt="Melhor post"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span className="font-mono text-[9px] uppercase tracking-[0.1em]" style={{ color: 'var(--accent)' }}>MELHOR POST</span>
                {bestPost.tipo && (
                  <span className="font-mono text-[9px] uppercase" style={{ color: 'var(--text-disabled)' }}>{bestPost.tipo}</span>
                )}
              </div>
              {bestPost.caption && (
                <p className="font-sans text-xs" style={{
                  color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '10px',
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                  {bestPost.caption}
                </p>
              )}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Curtidas',    value: formatNum(bestPost.likes) },
                  { label: 'Comentários', value: formatNum(bestPost.comments_count) },
                  { label: 'Salvos',      value: formatNum(bestPost.saved) },
                  { label: 'Impressões',  value: formatNum(bestPost.impressions) },
                  { label: 'Alcance',     value: formatNum(bestPost.reach) },
                ].map(s => (
                  <div key={s.label}>
                    <span className="font-mono text-[9px] uppercase tracking-[0.08em]" style={{ color: 'var(--text-secondary)', display: 'block' }}>{s.label}</span>
                    <span className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
            {bestPost.permalink && (
              <a href={bestPost.permalink} target="_blank" rel="noopener noreferrer"
                className="font-mono text-[9px] uppercase"
                style={{ color: 'var(--text-secondary)', textDecoration: 'none', flexShrink: 0, padding: '4px 8px', border: '1px solid var(--border-subtle)', borderRadius: '4px' }}
              >
                Ver →
              </a>
            )}
          </div>
        )}
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
              impressoes={conteudo.alcance}
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
