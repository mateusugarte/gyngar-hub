import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { extractUrlMeta } from '@/lib/scraper/extract-url-meta'

export const runtime = 'nodejs'
export const maxDuration = 60

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function buildSystemPrompt(marketingContext: Record<string, unknown>): string {
  const ctx = Object.keys(marketingContext).length > 0
    ? JSON.stringify(marketingContext, null, 2)
    : 'Contexto de marketing não preenchido.'

  return `Você é especialista em remodelagem de conteúdo para Instagram B2B.
Sua tarefa: analisar um conteúdo de referência e gerar versões adaptadas para o nicho do usuário.

Contexto do usuário:
${ctx}

Regras de resposta:
- Sempre em markdown com seções claras
- Direto ao ponto — sem fluff, sem introduções longas
- Cada versão adaptada deve citar pilar + objetivo + formato recomendado
- NUNCA conteúdo genérico — use nicho/produto/ICP do usuário injetado acima`
}

function buildUserPrompt(userMessage: string, url: string, title: string | null, description: string | null): string {
  const parts: string[] = []

  parts.push(`URL de referência: ${url}`)
  parts.push(`Plataforma: Instagram`)

  if (title) parts.push(`\nTítulo: ${title}`)
  if (description) parts.push(`\nDescrição/legenda:\n${description.slice(0, 1200)}`)
  if (!title && !description) {
    parts.push('\n[Não foi possível extrair o conteúdo automaticamente. Use o contexto da URL e a mensagem do usuário para análise.]')
  }

  parts.push(`\nInstrução do usuário:\n${userMessage}`)

  parts.push(`
---
Com base no conteúdo acima, entregue:

## 🔍 Análise do Original
- **Hook type**: (Curiosidade / Contrariedade / Promessa / Dado / Pergunta)
- **Formato**: (Reel / Carrossel / Story)
- **Mecanismo psicológico**: o que faz funcionar
- **Estrutura**: como o conteúdo está organizado
- **O que funcionou**: 3 elementos-chave que podem ser replicados

## 🔄 Versão Adaptada 1
- Pilar: | Objetivo: | Formato recomendado:
- Hook adaptado: ...
- Estrutura do roteiro:
- CTA:

## 🔄 Versão Adaptada 2
- Pilar: | Objetivo: | Formato recomendado:
- Hook adaptado: ...
- Estrutura do roteiro:
- CTA:

## 🔄 Versão Adaptada 3 (bônus)
- Pilar: | Objetivo: | Formato recomendado:
- Hook adaptado: ...
- Estrutura do roteiro:
- CTA:

## ✅ Recomendação Final
Qual versão tem maior potencial de performance e por quê.`)

  return parts.join('\n')
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { url, userMessage } = await req.json() as { url: string; userMessage: string }
  if (!url || !userMessage) return new Response('url e userMessage obrigatórios', { status: 400 })

  const [settingsRow, contextRow] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('user_settings')
      .select('ai_model')
      .eq('user_id', user.id)
      .single(),
    supabase.from('user_marketing_context').select('context').eq('user_id', user.id).single(),
  ])

  const aiModel: string = settingsRow?.data?.ai_model ?? 'gpt-4o'
  const marketingContext = (contextRow.data?.context as Record<string, unknown>) ?? {}

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function send(text: string) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
      }

      try {
        const meta = await extractUrlMeta(url)

        const systemPrompt = buildSystemPrompt(marketingContext)
        const userPrompt = buildUserPrompt(userMessage, url, meta.title, meta.description)

        const openaiStream = await openai.chat.completions.create({
          model: aiModel,
          max_tokens: 3000,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          stream: true,
        })

        for await (const chunk of openaiStream) {
          const text = chunk.choices[0]?.delta?.content
          if (text) send(text)
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro'
        send(`\n\n[ERRO: ${msg}]`)
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
