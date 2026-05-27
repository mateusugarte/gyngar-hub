import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const appId = process.env.META_APP_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  // Validação explícita — cada variável individualmente
  if (!appId) {
    return NextResponse.json(
      { error: 'META_APP_ID não configurado no servidor. Preencha o .env.local e reinicie o servidor.' },
      { status: 500 }
    )
  }
  if (!appUrl) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_APP_URL não configurado no servidor.' },
      { status: 500 }
    )
  }

  const redirectUri = `${appUrl}/api/instagram/callback`

  const scopes = [
    'pages_show_list',              // lista páginas do Facebook → encontra conta IG vinculada
    'pages_read_engagement',        // dados de engajamento da página
    'instagram_basic',              // mídia, seguidores, perfil da conta IG
    'instagram_manage_insights',    // insights: impressões, alcance, visitas ao perfil
    'instagram_manage_comments',    // ler e gerenciar comentários nos posts
  ].join(',')

  const oauthUrl = new URL('https://www.facebook.com/v21.0/dialog/oauth')
  oauthUrl.searchParams.set('client_id', appId)
  oauthUrl.searchParams.set('redirect_uri', redirectUri)
  oauthUrl.searchParams.set('scope', scopes)
  oauthUrl.searchParams.set('response_type', 'code')
  oauthUrl.searchParams.set('state', user.id)

  return NextResponse.redirect(oauthUrl.toString())
}
