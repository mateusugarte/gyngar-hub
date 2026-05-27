import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { marketingContext?: Record<string, unknown> }
  const marketingContext = body.marketingContext ?? {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const settingsRow = await (supabase as any).from('user_settings').select('ai_model').eq('user_id', user.id).single()
  const aiModel: string = settingsRow?.data?.ai_model ?? 'gpt-4o'

  const systemPrompt = `Você é um estrategista de conteúdo especializado em Instagram para negócios B2B.
Contexto do usuário: ${JSON.stringify(marketingContext, null, 2)}

Frameworks que você SEMPRE aplica:
- Mix de pilares: 40% Educacional, 20% Bastidores, 15% Prova Social, 15% Engajamento, 10% Promocional
- Estrutura de vídeo: 0-3s hook (interrompe o scroll), 3-15s problema, 15-50s valor, 50-60s CTA
- Para posts isca: a palavra isca aparece nos comentários + oferta de valor em DM
- Hooks funcionam por: Curiosidade / Contrariedade / História / Valor direto

Para CADA recomendação, você DEVE:
1. Explicar qual pilar essa recomendação atende
2. Citar qual princípio de marketing justifica a escolha
3. Dar um exemplo concreto aplicado ao negócio do usuário

Entregue um plano mensal com:
- Quantidade de posts por semana (Reels e Carrosséis separados)
- Distribuição pelos 5 pilares
- 3 ideias de posts isca personalizadas para o nicho
- 2 sugestões de hooks baseados no ICP
- Regras de constância recomendadas`

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const openaiStream = await client.chat.completions.create({
          model: aiModel,
          max_tokens: 4000,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Crie meu planejamento de conteúdo mensal personalizado para o Instagram.' },
          ],
          stream: true,
        })

        for await (const chunk of openaiStream) {
          const text = chunk.choices[0]?.delta?.content
          if (text) controller.enqueue(encoder.encode(text))
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro'
        controller.enqueue(encoder.encode(`\n\n[ERRO: ${msg}]`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  })
}
