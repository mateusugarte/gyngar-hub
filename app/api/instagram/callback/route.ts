import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database.types'

// Toda a Instagram Graph API para Business usa graph.facebook.com
const FB_GRAPH_BASE = 'https://graph.facebook.com/v21.0'

interface PageWithIg {
  pageId: string
  pageName: string
  igAccountId: string
  igUsername: string | null
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const userId = searchParams.get('state')
  const oauthError = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  if (oauthError || !code || !userId) {
    const reason = searchParams.get('error_description') ?? oauthError ?? 'Parâmetros inválidos'
    return NextResponse.redirect(`${appUrl}/settings?ig_error=${encodeURIComponent(reason)}`)
  }

  const appId = process.env.META_APP_ID!
  const appSecret = process.env.META_APP_SECRET!
  const redirectUri = `${appUrl}/api/instagram/callback`

  try {
    console.log('FALLBACK_PAGE_ID:', process.env.META_FALLBACK_PAGE_ID)

    // 1. Trocar code por short-lived token
    const tokenRes = await fetch(`${FB_GRAPH_BASE}/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code }),
    })
    if (!tokenRes.ok) {
      const err = await tokenRes.json().catch(() => ({})) as { error?: { message?: string } }
      throw new Error(err?.error?.message ?? `Token exchange failed: ${tokenRes.status}`)
    }
    const { access_token: shortLivedToken } = await tokenRes.json() as { access_token: string }

    // 2. Trocar por long-lived token (~60 dias)
    const llRes = await fetch(
      `${FB_GRAPH_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`
    )
    if (!llRes.ok) throw new Error(`Long-lived token exchange failed: ${llRes.status}`)
    const llJson = await llRes.json() as { access_token: string; expires_in: number }
    const longLivedToken = llJson.access_token

    // 3. Tentativa 1: /me/accounts — páginas clássicas do Facebook
    //    O page.access_token já vem nos fields; usá-lo (não o user token)
    //    garante acesso a contas em portfólio empresarial.
    const pagesRes = await fetch(
      `${FB_GRAPH_BASE}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${longLivedToken}&limit=50`
    )
    const pagesJson = await pagesRes.json() as {
      data: Array<{
        id: string
        name: string
        access_token?: string
        instagram_business_account?: { id: string; username?: string }
      }>
    }

    console.log('accounts data length:', pagesJson.data?.length ?? 'undefined')

    const eligible: PageWithIg[] = []

    // Coleta a partir de /me/accounts
    for (const page of pagesJson.data ?? []) {
      if (!page.instagram_business_account?.id) continue
      eligible.push({
        pageId: page.id,
        pageName: page.name,
        igAccountId: page.instagram_business_account.id,
        igUsername: page.instagram_business_account.username ?? null,
      })
    }

    // Tentativa 2: /me/accounts vazio → buscar página diretamente pelo ID
    // Necessário para contas em portfólio empresarial que não aparecem em /me/accounts.
    // Configure META_FALLBACK_PAGE_ID no .env com o ID da sua Página do Facebook.
    if (eligible.length === 0) {
      const fallbackPageId = process.env.META_FALLBACK_PAGE_ID
      if (fallbackPageId) {
        const directRes = await fetch(
          `${FB_GRAPH_BASE}/${fallbackPageId}?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${longLivedToken}`
        )
        const directJson = await directRes.json() as {
          id?: string
          name?: string
          access_token?: string
          instagram_business_account?: { id: string; username?: string }
        }
        console.log('Fallback page response:', JSON.stringify(directJson))
        console.log('Page access_token exists:', !!directJson.access_token)
        // Se a página retornou um page access_token próprio, usá-lo para
        // nova busca — garante acesso completo aos campos de negócio.
        if (directJson.id && directJson.access_token && !directJson.instagram_business_account) {
          const withPageTokenRes = await fetch(
            `${FB_GRAPH_BASE}/${directJson.id}?fields=id,name,instagram_business_account{id,username}&access_token=${directJson.access_token}`
          )
          const withPageTokenJson = await withPageTokenRes.json() as {
            id?: string
            name?: string
            instagram_business_account?: { id: string; username?: string }
          }
          console.log('IG from page token:', JSON.stringify(withPageTokenJson))
          if (withPageTokenJson.instagram_business_account?.id) {
            eligible.push({
              pageId: withPageTokenJson.id ?? fallbackPageId,
              pageName: withPageTokenJson.name ?? directJson.name ?? 'Página direta',
              igAccountId: withPageTokenJson.instagram_business_account.id,
              igUsername: withPageTokenJson.instagram_business_account.username ?? null,
            })
          }
        } else if (directJson.instagram_business_account?.id) {
          eligible.push({
            pageId: directJson.id ?? fallbackPageId,
            pageName: directJson.name ?? 'Página direta',
            igAccountId: directJson.instagram_business_account.id,
            igUsername: directJson.instagram_business_account.username ?? null,
          })
        }
      }
    }

    // Tentativa 3: /me direto (conta pessoal com IG vinculado)
    if (eligible.length === 0) {
      const igDirectRes = await fetch(
        `${FB_GRAPH_BASE}/me?fields=id,name,instagram_business_account{id,username}&access_token=${longLivedToken}`
      )
      const igDirectJson = await igDirectRes.json() as {
        id?: string
        name?: string
        instagram_business_account?: { id: string; username?: string }
      }
      if (igDirectJson.instagram_business_account?.id) {
        eligible.push({
          pageId: igDirectJson.id ?? 'me',
          pageName: igDirectJson.name ?? 'Conta direta',
          igAccountId: igDirectJson.instagram_business_account.id,
          igUsername: igDirectJson.instagram_business_account.username ?? null,
        })
      }
    }

    // Tentativa 4: Business Manager
    if (eligible.length === 0) {
      const businessRes = await fetch(
        `${FB_GRAPH_BASE}/me/businesses?fields=id,name,instagram_accounts{id,username}&access_token=${longLivedToken}`
      )
      const businessJson = await businessRes.json() as {
        data?: Array<{
          id: string
          name: string
          instagram_accounts?: { data: Array<{ id: string; username?: string }> }
        }>
      }
      for (const biz of businessJson.data ?? []) {
        for (const igAcc of biz.instagram_accounts?.data ?? []) {
          eligible.push({
            pageId: biz.id,
            pageName: biz.name,
            igAccountId: igAcc.id,
            igUsername: igAcc.username ?? null,
          })
        }
      }
    }

    if (eligible.length === 0) {
      throw new Error(
        'Nenhuma conta Instagram Business foi encontrada. ' +
        'Verifique se sua conta Instagram está configurada como Profissional/Business e vinculada ao Facebook.'
      )
    }

    // Sempre mostra o seletor — mesmo com 1 opção — para o usuário confirmar qual conta conectar
    const pending = JSON.stringify({ userId, token: longLivedToken, pages: eligible })
    const response = NextResponse.redirect(`${appUrl}/settings?ig_select=1`)
    response.cookies.set('ig_pending', pending, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutos
      path: '/',
    })
    return response

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.redirect(`${appUrl}/settings?ig_error=${encodeURIComponent(msg)}`)
  }
}

// Mantida para uso futuro (ex: conexão direta via deep link)
export async function saveConnection({
  userId,
  account,
  token,
  appUrl,
}: {
  userId: string
  account: PageWithIg
  token: string
  appUrl: string
}) {
  const supabase = createAdminClient()
  const upsert: Database['public']['Tables']['user_settings']['Update'] & { user_id: string } = {
    user_id: userId,
    ig_access_token: token,
    ig_account_id: account.igAccountId,
  }

  const { error: dbError } = await supabase
    .from('user_settings')
    .upsert(upsert, { onConflict: 'user_id' })

  if (dbError) throw new Error(dbError.message)

  const display = account.igUsername ? `@${account.igUsername}` : account.igAccountId
  return NextResponse.redirect(
    `${appUrl}/settings?ig_success=1&ig_user=${encodeURIComponent(display)}`
  )
}
