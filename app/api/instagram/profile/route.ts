import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getIgProfile } from '@/lib/instagram/graph-api'

export async function GET() {
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

  try {
    const profile = await getIgProfile(settings.ig_account_id, settings.ig_access_token)
    return NextResponse.json(profile)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao buscar perfil' },
      { status: 500 }
    )
  }
}
