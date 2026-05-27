import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ig_media_id, is_isca } = await req.json() as { ig_media_id: string; is_isca: boolean }
  if (!ig_media_id || typeof is_isca !== 'boolean') {
    return NextResponse.json({ error: 'ig_media_id e is_isca obrigatórios' }, { status: 400 })
  }

  const { error } = await supabase
    .from('instagram_posts')
    .update({ is_isca })
    .eq('user_id', user.id)
    .eq('ig_media_id', ig_media_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, ig_media_id, is_isca })
}
