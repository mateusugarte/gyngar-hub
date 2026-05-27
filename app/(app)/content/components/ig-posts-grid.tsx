'use client'

import { useState } from 'react'
import { Image, Video, Play, LayoutGrid, Heart, MessageCircle, Bookmark, Eye, ExternalLink, X, Users, UserCheck, Clock } from 'lucide-react'
import type { PostEvaluation } from '@/lib/anthropic/content-evaluator'

export interface IgPostItem {
  ig_media_id: string
  tipo: string | null
  caption: string | null
  likes: number
  comments_count: number
  saved: number
  reach: number
  views: number
  impressions: number
  video_plays: number | null
  reach_followers: number | null
  reach_non_followers: number | null
  avg_watch_time_ms: number | null
  thumbnail_url: string | null
  media_url: string | null
  permalink: string | null
  data_publicacao: string | null
  is_isca?: boolean | null
  ai_evaluation?: PostEvaluation | null
}

function formatNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function fmtSec(ms: number) {
  const s = Math.round(ms / 1000)
  if (s >= 60) return `${Math.floor(s / 60)}m${s % 60}s`
  return `${s}s`
}

function tipoIcon(tipo: string | null) {
  switch (tipo) {
    case 'REEL':           return <Play size={10} />
    case 'VIDEO':          return <Video size={10} />
    case 'CAROUSEL_ALBUM': return <LayoutGrid size={10} />
    default:               return <Image size={10} />
  }
}

function tipoLabel(tipo: string | null) {
  switch (tipo) {
    case 'REEL':           return 'Reel'
    case 'VIDEO':          return 'Vídeo'
    case 'CAROUSEL_ALBUM': return 'Carrossel'
    default:               return 'Foto'
  }
}

function postImage(post: IgPostItem): string | null {
  if (post.tipo === 'REEL' || post.tipo === 'VIDEO') {
    return post.thumbnail_url ?? post.media_url ?? null
  }
  return post.media_url ?? post.thumbnail_url ?? null
}

// ─── Modal de Avaliação ───────────────────────────────────────────────────────

function EvaluationModal({
  post,
  onClose,
}: {
  post: IgPostItem
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [evaluation, setEvaluation] = useState<PostEvaluation | null>(post.ai_evaluation ?? null)
  const [error, setError] = useState<string | null>(null)

  async function handleEvaluate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/evaluate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ig_media_id: post.ig_media_id }),
      })
      const json = await res.json() as PostEvaluation & { error?: string }
      if (!res.ok) { setError(json.error ?? `Erro ${res.status}`); return }
      setEvaluation(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de rede')
    } finally {
      setLoading(false)
    }
  }

  const MONO_XS = 'font-mono text-[9px] uppercase tracking-[0.07em]'
  const engagement = post.likes + post.comments_count + post.saved
  const engRate = post.reach > 0 ? ((engagement / post.reach) * 100).toFixed(1) : '—'
  const totalBreakdown = (post.reach_followers ?? 0) + (post.reach_non_followers ?? 0)
  const img = postImage(post)

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '14px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
      }}>
        {/* Header do modal */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          position: 'sticky', top: 0,
          background: 'var(--bg-surface)',
          zIndex: 1,
        }}>
          <span className={MONO_XS} style={{ color: 'var(--text-secondary)' }}>
            AVALIAÇÃO DE CONTEÚDO
          </span>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Post preview + métricas */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            {img && (
              <div style={{ width: '72px', height: '72px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-base)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                <span className={MONO_XS} style={{ color: 'var(--accent)' }}>{tipoLabel(post.tipo)}</span>
                {post.data_publicacao && (
                  <span className={MONO_XS} style={{ color: 'var(--text-disabled)' }}>
                    {new Date(post.data_publicacao).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
              {post.caption && (
                <p className="font-sans text-xs" style={{
                  color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '10px',
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                  {post.caption}
                </p>
              )}
            </div>
          </div>

          {/* Métricas detalhadas */}
          <div style={{
            background: 'var(--bg-base)',
            borderRadius: '10px',
            padding: '14px 16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
            gap: '12px',
          }}>
            {[
              { label: 'Alcance',      value: formatNum(post.reach),         icon: <Eye size={10} /> },
              { label: 'Curtidas',     value: formatNum(post.likes),          icon: <Heart size={10} /> },
              { label: 'Comentários',  value: formatNum(post.comments_count), icon: <MessageCircle size={10} /> },
              { label: 'Salvos',       value: formatNum(post.saved),          icon: <Bookmark size={10} /> },
              { label: 'Engajamento',  value: `${engRate}%`,                  icon: null },
              ...(post.video_plays && post.video_plays > 0 ? [{ label: 'Visualizações', value: formatNum(post.video_plays), icon: <Play size={10} /> }] : []),
              ...(post.avg_watch_time_ms && post.avg_watch_time_ms > 0 ? [{ label: 'Tempo médio', value: fmtSec(post.avg_watch_time_ms), icon: <Clock size={10} /> }] : []),
              ...(totalBreakdown > 0 ? [
                { label: 'Seguidores',     value: `${formatNum(post.reach_followers ?? 0)} (${Math.round((post.reach_followers ?? 0) / totalBreakdown * 100)}%)`, icon: <UserCheck size={10} /> },
                { label: 'Não-seguidores', value: `${formatNum(post.reach_non_followers ?? 0)} (${Math.round((post.reach_non_followers ?? 0) / totalBreakdown * 100)}%)`, icon: <Users size={10} /> },
              ] : []),
            ].map(m => (
              <div key={m.label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '2px' }}>
                  {m.icon && <span style={{ color: 'var(--text-disabled)' }}>{m.icon}</span>}
                  <span className={MONO_XS} style={{ color: 'var(--text-secondary)' }}>{m.label}</span>
                </div>
                <span className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>{m.value}</span>
              </div>
            ))}
          </div>

          {/* Avaliação IA */}
          {!evaluation && !loading && (
            <div style={{ textAlign: 'center' }}>
              {error && (
                <p className="font-sans text-xs" style={{ color: 'var(--error)', marginBottom: '12px' }}>{error}</p>
              )}
              <button
                type="button"
                onClick={handleEvaluate}
                className={MONO_XS}
                style={{
                  padding: '10px 24px',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--bg-base)',
                  cursor: 'pointer',
                  fontSize: '10px',
                }}
              >
                Avaliar Conteúdo com IA
              </button>
              <p className="font-sans text-[10px]" style={{ color: 'var(--text-disabled)', marginTop: '8px' }}>
                O agente analisará as métricas e o contexto do seu negócio
              </p>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <span className={MONO_XS} style={{ color: 'var(--text-secondary)' }}>
                Agente avaliando o conteúdo...
              </span>
            </div>
          )}

          {evaluation && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Status + Score */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 16px',
                borderRadius: '10px',
                background: evaluation.status === 'deu_certo' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${evaluation.status === 'deu_certo' ? 'var(--success)' : 'var(--error)'}`,
              }}>
                <span style={{ fontSize: '24px' }}>{evaluation.status === 'deu_certo' ? '✅' : '❌'}</span>
                <div style={{ flex: 1 }}>
                  <span className="font-sans text-sm font-medium" style={{ color: 'var(--text-primary)', display: 'block' }}>
                    {evaluation.status === 'deu_certo' ? 'Deu certo' : 'Flopou'}
                  </span>
                  <span className="font-sans text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {evaluation.resumo}
                  </span>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span className="font-mono text-2xl" style={{ color: evaluation.status === 'deu_certo' ? 'var(--success)' : 'var(--error)' }}>
                    {evaluation.score}
                  </span>
                  <span className={MONO_XS} style={{ color: 'var(--text-disabled)', display: 'block' }}>/ 100</span>
                </div>
              </div>

              {/* Análise */}
              <div>
                <span className={MONO_XS} style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>ANÁLISE</span>
                <p className="font-sans text-sm" style={{ color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                  {evaluation.analise}
                </p>
              </div>

              {/* O que funcionou */}
              {evaluation.o_que_funcionou && (
                <div>
                  <span className={MONO_XS} style={{ color: 'var(--success)', display: 'block', marginBottom: '6px' }}>O QUE FUNCIONOU</span>
                  <p className="font-sans text-sm" style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>
                    {evaluation.o_que_funcionou}
                  </p>
                </div>
              )}

              {/* O que melhorar */}
              {evaluation.o_que_melhorar.length > 0 && (
                <div>
                  <span className={MONO_XS} style={{ color: 'var(--warning)', display: 'block', marginBottom: '8px' }}>O QUE MELHORAR</span>
                  <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {evaluation.o_que_melhorar.map((s, i) => (
                      <li key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '1px' }}>→</span>
                        <span className="font-sans text-sm" style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Próximo passo */}
              <div style={{
                padding: '12px 16px',
                background: 'var(--bg-base)',
                borderRadius: '8px',
                borderLeft: '3px solid var(--accent)',
              }}>
                <span className={MONO_XS} style={{ color: 'var(--accent)', display: 'block', marginBottom: '4px' }}>PRÓXIMO PASSO</span>
                <p className="font-sans text-sm" style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>
                  {evaluation.proximo_passo}
                </p>
              </div>

              {/* Reavaliar */}
              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={handleEvaluate}
                  className={MONO_XS}
                  style={{
                    padding: '6px 16px',
                    background: 'transparent',
                    border: '1px solid var(--border-visible)',
                    borderRadius: '6px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  Reavaliar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

function PostCard({ post }: { post: IgPostItem }) {
  const [imgError, setImgError] = useState(false)
  const [isIsca, setIsIsca] = useState(post.is_isca ?? false)
  const [toggling, setToggling] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const img = postImage(post)
  const engagement = post.likes + post.comments_count + post.saved
  const engRate = post.reach > 0 ? ((engagement / post.reach) * 100).toFixed(1) : '—'
  const hasEval = !!(post.ai_evaluation)

  const MONO_XS = 'font-mono text-[9px] uppercase tracking-[0.07em]'

  async function handleToggleIsca() {
    setToggling(true)
    const next = !isIsca
    setIsIsca(next)
    try {
      const res = await fetch('/api/instagram/mark-isca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ig_media_id: post.ig_media_id, is_isca: next }),
      })
      if (!res.ok) setIsIsca(!next)
    } catch {
      setIsIsca(!next)
    } finally {
      setToggling(false)
    }
  }

  return (
    <>
      {showModal && <EvaluationModal post={post} onClose={() => setShowModal(false)} />}

      <div
        style={{
          background: 'var(--bg-surface)',
          border: isIsca ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
          borderRadius: '10px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Imagem / thumbnail */}
        <div style={{ position: 'relative', aspectRatio: '1 / 1', background: 'var(--bg-base)', flexShrink: 0 }}>
          {img && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt={post.caption?.slice(0, 60) ?? 'Post'}
              onError={() => setImgError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {tipoIcon(post.tipo)}
            </div>
          )}

          {/* Badge de tipo */}
          <div style={{
            position: 'absolute', top: '6px', left: '6px',
            display: 'flex', alignItems: 'center', gap: '3px',
            padding: '2px 6px',
            background: 'rgba(0,0,0,0.6)',
            borderRadius: '4px',
            backdropFilter: 'blur(4px)',
          }}>
            <span style={{ color: '#fff', display: 'flex', alignItems: 'center' }}>{tipoIcon(post.tipo)}</span>
            <span className={MONO_XS} style={{ color: '#fff' }}>{tipoLabel(post.tipo)}</span>
          </div>

          {/* Badge de avaliação existente */}
          {hasEval && (
            <div style={{
              position: 'absolute', bottom: '6px', left: '6px',
              padding: '2px 6px',
              background: 'rgba(0,0,0,0.7)',
              borderRadius: '4px',
            }}>
              <span className={MONO_XS} style={{ color: post.ai_evaluation!.status === 'deu_certo' ? '#4ade80' : '#f87171' }}>
                {post.ai_evaluation!.status === 'deu_certo' ? '✅' : '❌'} {post.ai_evaluation!.score}/100
              </span>
            </div>
          )}

          {/* Link externo */}
          {post.permalink && (
            <a
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                position: 'absolute', top: '6px', right: '6px',
                padding: '4px',
                background: 'rgba(0,0,0,0.6)',
                borderRadius: '4px',
                backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center',
                color: '#fff',
              }}
            >
              <ExternalLink size={10} />
            </a>
          )}
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="font-sans text-[11px]" style={{
            color: 'var(--text-secondary)',
            padding: '8px 10px 0',
            lineHeight: 1.5,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {post.caption}
          </p>
        )}

        {/* Métricas */}
        <div style={{
          padding: '8px 10px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          marginTop: 'auto',
        }}>
          {/* Curtidas, comentários, salvos */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { icon: <Heart size={10} />,        value: formatNum(post.likes),          label: 'curtidas' },
              { icon: <MessageCircle size={10} />, value: formatNum(post.comments_count), label: 'coments' },
              { icon: <Bookmark size={10} />,      value: formatNum(post.saved),          label: 'salvos' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex' }}>{s.icon}</span>
                <span className="font-mono text-[10px]" style={{ color: 'var(--text-primary)' }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Alcance + plays + engajamento */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Eye size={10} style={{ color: 'var(--text-secondary)' }} />
              <span className={MONO_XS} style={{ color: 'var(--text-secondary)' }}>
                {formatNum(post.reach)} alcance
              </span>
            </div>
            {(post.video_plays ?? 0) > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Play size={10} style={{ color: 'var(--text-secondary)' }} />
                <span className={MONO_XS} style={{ color: 'var(--text-secondary)' }}>
                  {formatNum(post.video_plays!)} views
                </span>
              </div>
            )}
            <span className={MONO_XS} style={{ color: 'var(--accent)', marginLeft: 'auto' }}>
              {engRate}% eng
            </span>
          </div>

          {/* Seguidores vs não-seguidores (se disponível) */}
          {((post.reach_followers ?? 0) > 0 || (post.reach_non_followers ?? 0) > 0) && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { icon: <UserCheck size={9} />, label: 'seg', value: post.reach_followers ?? 0 },
                { icon: <Users size={9} />,     label: 'não-seg', value: post.reach_non_followers ?? 0 },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <span style={{ color: 'var(--text-disabled)', display: 'flex' }}>{s.icon}</span>
                  <span className={MONO_XS} style={{ color: 'var(--text-disabled)' }}>
                    {formatNum(s.value)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Avaliar + isca */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className={MONO_XS}
              style={{
                flex: 1,
                padding: '4px 6px',
                background: hasEval ? 'transparent' : 'var(--accent)',
                border: hasEval ? '1px solid var(--border-visible)' : 'none',
                borderRadius: '4px',
                color: hasEval ? 'var(--text-secondary)' : 'var(--bg-base)',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              {hasEval ? 'Ver avaliação' : 'Avaliar'}
            </button>

            <button
              type="button"
              onClick={handleToggleIsca}
              disabled={toggling}
              className={MONO_XS}
              style={{
                padding: '4px 6px',
                background: 'transparent',
                border: 'none',
                cursor: toggling ? 'not-allowed' : 'pointer',
                color: isIsca ? 'var(--accent)' : 'var(--text-disabled)',
                opacity: toggling ? 0.5 : 1,
                flexShrink: 0,
              }}
            >
              {isIsca ? '★ isca' : '☆ isca'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

export function IgPostsGrid({ posts }: { posts: IgPostItem[] }) {
  const [filter, setFilter] = useState<string>('TODOS')

  const tipos = ['TODOS', ...Array.from(new Set(posts.map(p => p.tipo ?? 'IMAGE')))]
  const filtered = filter === 'TODOS' ? posts : posts.filter(p => (p.tipo ?? 'IMAGE') === filter)

  const MONO_XS = 'font-mono text-[9px] uppercase tracking-[0.07em]'

  return (
    <section style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '12px',
      padding: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <span className={MONO_XS} style={{ color: 'var(--text-secondary)' }}>
          POSTS SINCRONIZADOS ({posts.length})
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {tipos.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              className={MONO_XS}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                border: '1px solid',
                borderColor: filter === t ? 'var(--accent)' : 'var(--border-subtle)',
                background: filter === t ? 'var(--accent)' : 'transparent',
                color: filter === t ? 'var(--bg-base)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {t === 'CAROUSEL_ALBUM' ? 'CARROSSEL' : t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="font-sans text-xs" style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '32px 0' }}>
          Nenhum post encontrado.
        </p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
          gap: '10px',
        }}>
          {filtered.map(post => (
            <PostCard key={post.ig_media_id} post={post} />
          ))}
        </div>
      )}
    </section>
  )
}
