import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runMarketingAgent } from '@/lib/anthropic/agents/marketing-agent'
import type { MarketingAgentMode, MarketingMessage } from '@/lib/anthropic/agents/marketing-agent'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { messages, mode, contentModel, youtubeUrl } = await req.json() as {
    messages: MarketingMessage[]
    mode?: MarketingAgentMode
    contentModel?: string
    youtubeUrl?: string
  }

  const [contextRow, settingsRow] = await Promise.all([
    supabase.from('user_marketing_context').select('context').eq('user_id', user.id).single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('user_settings').select('ai_model').eq('user_id', user.id).single(),
  ])

  const marketingContext = (contextRow?.data?.context as Record<string, unknown>) ?? {}
  const aiModel: string = settingsRow?.data?.ai_model ?? 'gpt-4o'

  const agentStream = runMarketingAgent({
    messages,
    userMarketingContext: marketingContext,
    mode,
    contentModel,
    youtubeUrl,
    model: aiModel,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const text of agentStream) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
          )
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
