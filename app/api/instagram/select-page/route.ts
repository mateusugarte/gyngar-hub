import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database.types'

interface PendingCookie {
  userId: string
  token: string
  pages: { pageId: string; pageName: string; igAccountId: string; igUsername: string | null }[]
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { igAccountId } = await req.json() as { igAccountId: string }
  if (!igAccountId) return NextResponse.json({ error: 'igAccountId obrigatório' }, { status: 400 })

  const cookieValue = req.cookies.get('ig_pending')?.value
  if (!cookieValue) {
    return NextResponse.json({ error: 'Sessão de conexão expirada. Tente conectar novamente.' }, { status: 400 })
  }

  let pending: PendingCookie
  try {
    pending = JSON.parse(cookieValue) as PendingCookie
  } catch {
    return NextResponse.json({ error: 'Cookie inválido.' }, { status: 400 })
  }

  // Garante que o userId do cookie bate com o usuário logado
  if (pending.userId !== user.id) {
    return NextResponse.json({ error: 'Sessão inválida.' }, { status: 403 })
  }

  const chosen = pending.pages.find(p => p.igAccountId === igAccountId)
  if (!chosen) {
    return NextResponse.json({ error: 'Página não encontrada na sessão.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verifica se está trocando de conta IG — se sim, apaga posts da conta anterior
  const { data: existing } = await admin
    .from('user_settings')
    .select('ig_account_id')
    .eq('user_id', user.id)
    .single()

  if (existing?.ig_account_id && existing.ig_account_id !== chosen.igAccountId) {
    await admin.from('instagram_posts').delete().eq('user_id', user.id)
  }

  const upsert: Database['public']['Tables']['user_settings']['Update'] & { user_id: string } = {
    user_id: user.id,
    ig_access_token: pending.token,
    ig_account_id: chosen.igAccountId,
  }

  const { error: dbError } = await admin
    .from('user_settings')
    .upsert(upsert, { onConflict: 'user_id' })

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  const display = chosen.igUsername ? `@${chosen.igUsername}` : chosen.igAccountId
  const response = NextResponse.json({ ok: true, display })

  // Limpa o cookie após uso
  response.cookies.set('ig_pending', '', { maxAge: 0, path: '/' })

  return response
}
