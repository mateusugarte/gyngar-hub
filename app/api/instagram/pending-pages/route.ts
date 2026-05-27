import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface PendingCookie {
  userId: string
  token: string
  pages: { pageId: string; pageName: string; igAccountId: string; igUsername: string | null }[]
}

// Retorna apenas os metadados das páginas (sem o token) para o componente cliente
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cookieValue = req.cookies.get('ig_pending')?.value
  if (!cookieValue) return NextResponse.json({ pages: [] })

  try {
    const pending = JSON.parse(cookieValue) as PendingCookie
    if (pending.userId !== user.id) return NextResponse.json({ pages: [] })

    // Retorna só os metadados — nunca expõe o token ao cliente
    return NextResponse.json({
      pages: pending.pages.map(({ pageId, pageName, igAccountId, igUsername }) => ({
        pageId, pageName, igAccountId, igUsername,
      })),
    })
  } catch {
    return NextResponse.json({ pages: [] })
  }
}
