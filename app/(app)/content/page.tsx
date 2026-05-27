import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ContentHeader } from './components/content-header'
import { IgPostsGrid } from './components/ig-posts-grid'
import type { IgPostItem } from './components/ig-posts-grid'

export default async function ContentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [settingsRes, mktCtxRes, postsFullRes, calRes] = await Promise.all([
    supabase.from('user_settings').select('ig_access_token').eq('user_id', user.id).single(),
    supabase.from('user_marketing_context').select('context').eq('user_id', user.id).single(),
    supabase
      .from('instagram_posts')
      .select('ig_media_id,tipo,caption,likes,comments_count,saved,reach,views,impressions,video_plays,reach_followers,reach_non_followers,avg_watch_time_ms,thumbnail_url,media_url,permalink,data_publicacao,is_isca,ai_evaluation')
      .eq('user_id', user.id)
      .order('data_publicacao', { ascending: false })
      .limit(50),
    supabase.from('content_calendar').select('data_planejada').eq('user_id', user.id).gte('data_planejada', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]).lte('data_planejada', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]),
  ])

  const hasIg = !!(settingsRes.data?.ig_access_token)
  const marketingContext = (mktCtxRes.data?.context as Record<string, unknown>) ?? {}
  const igPosts = (postsFullRes.data ?? []) as IgPostItem[]

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const postsThisMonth = igPosts.filter(p => {
    const d = new Date(p.data_publicacao ?? '')
    return d >= monthStart && d <= monthEnd
  })
  const postsFeitosMes = postsThisMonth.length
  const postsPrevistosMes = (calRes.data ?? []).length

  // Totais acumulados de todos os posts sincronizados
  const alcanceTotal = igPosts.reduce((s, p) => s + (p.reach ?? 0), 0)
  const curtidasTotal = igPosts.reduce((s, p) => s + (p.likes ?? 0), 0)
  const comentariosTotal = igPosts.reduce((s, p) => s + (p.comments_count ?? 0), 0)
  const salvosTotal = igPosts.reduce((s, p) => s + (p.saved ?? 0), 0)
  const engajamentoMedio = igPosts.length > 0
    ? igPosts.reduce((s, p) => {
        const eng = p.reach > 0 ? (p.likes + p.comments_count + p.saved) / p.reach * 100 : 0
        return s + eng
      }, 0) / igPosts.length
    : 0

  const hasContext = Object.keys(marketingContext).length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <ContentHeader
        marketingContext={marketingContext}
        hasIg={hasIg}
        alcance={alcanceTotal}
        curtidas={curtidasTotal}
        comentarios={comentariosTotal}
        salvos={salvosTotal}
        engajamentoMedio={engajamentoMedio}
        postsFeitosMes={postsFeitosMes}
        postsPrevistosMes={postsPrevistosMes}
      />

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Context missing banner */}
        {!hasContext && (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--text-secondary)' }}>
              CONTEXTO DE MARKETING
            </span>
            <p className="font-sans text-sm" style={{ color: 'var(--text-secondary)', maxWidth: '420px', lineHeight: 1.6 }}>
              Preencha seus objetivos de marketing para que o agente de IA crie planejamentos personalizados para o seu negócio.
            </p>
            <Link
              href="/content/objectives"
              className="font-mono text-[10px] uppercase"
              style={{
                padding: '8px 20px',
                background: 'var(--accent)',
                borderRadius: '6px',
                color: 'var(--bg-base)',
                textDecoration: 'none',
              }}
            >
              Preencher Objetivos →
            </Link>
          </div>
        )}

        {/* Quick access grid */}
        <div className="anim-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { href: '/content/calendar', title: 'Calendário', desc: `${postsPrevistosMes} posts planejados este mês`, color: 'var(--accent)' },
            { href: '/content/ideas', title: 'Banco de Ideias', desc: 'Crie e gerencie suas ideias de conteúdo', color: 'var(--warning)' },
            { href: '/content/objectives', title: 'Objetivos', desc: hasContext ? 'Contexto preenchido' : 'Preencha para personalizar a IA', color: hasContext ? 'var(--success)' : 'var(--text-secondary)' },
            { href: '/content/planning', title: 'Planejamento Mensal', desc: 'Distribua posts automaticamente pelo mês', color: 'var(--accent)' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="card-hover anim-page"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '20px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                textDecoration: 'none',
              }}
            >
              <span className="font-sans text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.title}</span>
              <span className="font-sans text-xs" style={{ color: 'var(--text-secondary)' }}>{item.desc}</span>
              <span className="font-mono text-[10px] uppercase" style={{ color: item.color }}>Acessar →</span>
            </Link>
          ))}
        </div>

        {/* Galeria de posts sincronizados */}
        {igPosts.length > 0 && <IgPostsGrid posts={igPosts} />}
      </div>
    </div>
  )
}
