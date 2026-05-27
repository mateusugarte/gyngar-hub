import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Remove dados da conta IG anterior para não contaminar métricas ao reconectar
  const [settingsRes, postsRes] = await Promise.all([
    supabase
      .from('user_settings')
      .update({ ig_access_token: null, ig_account_id: null })
      .eq('user_id', user.id),
    supabase
      .from('instagram_posts')
      .delete()
      .eq('user_id', user.id),
  ])

  // Comentários referenciam posts via FK — Postgres os remove em cascata (ON DELETE CASCADE)
  const error = settingsRes.error ?? postsRes.error
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
