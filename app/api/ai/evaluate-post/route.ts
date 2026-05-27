import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { evaluatePost } from '@/lib/anthropic/content-evaluator'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ig_media_id } = await req.json() as { ig_media_id: string }
  if (!ig_media_id) return NextResponse.json({ error: 'ig_media_id obrigatório' }, { status: 400 })

  const [postRes, mktCtxRes, settingsRes] = await Promise.all([
    supabase
      .from('instagram_posts')
      .select('tipo,caption,likes,comments_count,saved,reach,views,video_plays,reach_followers,reach_non_followers,avg_watch_time_ms,data_publicacao')
      .eq('user_id', user.id)
      .eq('ig_media_id', ig_media_id)
      .single(),
    supabase
      .from('user_marketing_context')
      .select('context')
      .eq('user_id', user.id)
      .single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('user_settings').select('ai_model').eq('user_id', user.id).single(),
  ])
  const aiModel: string = settingsRes?.data?.ai_model ?? 'gpt-4o'

  if (!postRes.data) return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 })

  const post = postRes.data

  try {
    const evaluation = await evaluatePost({
      tipo:               post.tipo,
      caption:            post.caption,
      likes:              post.likes              ?? 0,
      comments_count:     post.comments_count     ?? 0,
      saved:              post.saved              ?? 0,
      reach:              post.reach              ?? 0,
      views:              post.views              ?? 0,
      video_plays:        post.video_plays        ?? 0,
      reach_followers:    post.reach_followers    ?? 0,
      reach_non_followers: post.reach_non_followers ?? 0,
      avg_watch_time_ms:  post.avg_watch_time_ms  ?? 0,
      data_publicacao:    post.data_publicacao,
      marketingContext:   (mktCtxRes.data?.context as Record<string, unknown>) ?? undefined,
    }, aiModel)

    // Persiste a avaliação no post para não precisar chamar a IA novamente
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase
      .from('instagram_posts')
      .update({ ai_evaluation: evaluation as any })
      .eq('user_id', user.id)
      .eq('ig_media_id', ig_media_id)

    return NextResponse.json(evaluation)
  } catch (err) {
    console.error('[evaluate-post]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro na avaliação IA' },
      { status: 500 }
    )
  }
}
