import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getIgMedia,
  getIgPostInsights,
  getIgComments,
  getIgReachBreakdown,
  getIgReelMetrics,
} from '@/lib/instagram/graph-api'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: settings } = await supabase
    .from('user_settings')
    .select('ig_access_token, ig_account_id')
    .eq('user_id', user.id)
    .single()

  if (!settings?.ig_access_token || !settings?.ig_account_id) {
    return NextResponse.json({ error: 'Instagram não conectado' }, { status: 400 })
  }

  const { ig_access_token: token, ig_account_id: accountId } = settings

  let posts: Awaited<ReturnType<typeof getIgMedia>>
  try {
    posts = await getIgMedia(accountId, token)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao buscar posts' },
      { status: 500 }
    )
  }

  // Remove do DB posts que foram arquivados/deletados no Instagram.
  if (posts.length > 0) {
    const currentIds = posts.map(p => p.id)
    const oldestTimestamp = posts.reduce(
      (min, p) => (p.timestamp < min ? p.timestamp : min),
      posts[0].timestamp
    )
    await supabase
      .from('instagram_posts')
      .delete()
      .eq('user_id', user.id)
      .gte('data_publicacao', oldestTimestamp)
      .not('ig_media_id', 'in', `(${currentIds.join(',')})`)
  }

  let synced = 0
  let insightsFailed = 0
  const errors: string[] = []

  // Breakdown e métricas de reel: apenas para os 20 mais recentes (evitar rate limit)
  const BREAKDOWN_LIMIT = 20

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i]
    try {
      const insights = await getIgPostInsights(post.id, post.media_type, token)
      if (!insights) insightsFailed++

      const views = insights?.plays ?? insights?.video_views ?? 0

      // Métricas avançadas só para os 20 mais recentes
      let video_plays = 0
      let avg_watch_time_ms = 0
      let reach_followers = 0
      let reach_non_followers = 0

      if (i < BREAKDOWN_LIMIT) {
        const [breakdown, reelMetrics] = await Promise.all([
          getIgReachBreakdown(post.id, token),
          post.media_type === 'REEL' ? getIgReelMetrics(post.id, token) : Promise.resolve(null),
        ])

        if (breakdown) {
          reach_followers = breakdown.followers
          reach_non_followers = breakdown.non_followers
        }
        if (reelMetrics) {
          video_plays = reelMetrics.plays
          avg_watch_time_ms = reelMetrics.avg_watch_time_ms
        }
      }

      const { error: upsertError } = await supabase.from('instagram_posts').upsert(
        {
          user_id:              user.id,
          ig_media_id:          post.id,
          tipo:                 post.media_type      ?? null,
          caption:              post.caption         ?? null,
          impressions:          insights?.reach ?? 0,
          reach:                insights?.reach ?? 0,
          views,
          video_plays,
          reach_followers,
          reach_non_followers,
          avg_watch_time_ms,
          likes:                post.like_count       ?? 0,
          comments_count:       post.comments_count   ?? 0,
          saved:                insights?.saved        ?? 0,
          shares:               insights?.shares       ?? 0,
          thumbnail_url:        post.thumbnail_url    ?? null,
          media_url:            post.media_url         ?? null,
          permalink:            post.permalink         ?? null,
          data_publicacao:      post.timestamp,
        },
        { onConflict: 'user_id,ig_media_id' }
      )

      if (upsertError) {
        errors.push(`Post ${post.id}: ${upsertError.message}`)
      } else {
        synced++
      }
    } catch (err) {
      errors.push(`Post ${post.id}: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
  }

  // Sincroniza comentários dos 10 posts mais recentes
  const recentPosts = posts.slice(0, 10)
  let commentsSynced = 0

  for (const post of recentPosts) {
    try {
      const { data: postRow } = await supabase
        .from('instagram_posts')
        .select('id')
        .eq('user_id', user.id)
        .eq('ig_media_id', post.id)
        .single()

      if (!postRow) continue

      const comments = await getIgComments(post.id, token)

      for (const comment of comments) {
        await supabase.from('instagram_comments').upsert(
          {
            user_id:             user.id,
            ig_comment_id:       comment.id,
            post_id:             postRow.id,
            autor_ig:            comment.username,
            texto:               comment.text,
            data:                comment.timestamp,
            contem_palavra_isca: false,
          },
          { onConflict: 'user_id,ig_comment_id' }
        )
        commentsSynced++
      }
    } catch {
      // falha silenciosa — não bloqueia o sync de posts
    }
  }

  return NextResponse.json({
    synced,
    commentsSynced,
    insightsFailed: insightsFailed > 0 ? insightsFailed : undefined,
    errors: errors.length > 0 ? errors : undefined,
  })
}
