import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateIdeaWithAI } from '@/lib/anthropic/planning-agent'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    idea: { titulo: string; tipo: string; pilar: string; objetivo: string }
    marketingContext: Record<string, unknown>
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const settingsRow = await (supabase as any).from('user_settings').select('ai_model').eq('user_id', user.id).single()
  const aiModel: string = settingsRow?.data?.ai_model ?? 'gpt-4o'

  try {
    const result = await generateIdeaWithAI(body.idea, body.marketingContext, aiModel)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro' }, { status: 500 })
  }
}
