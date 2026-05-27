import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const maxDuration = 120

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function buildSystemPrompt(marketingContext: Record<string, unknown>): string {
  const ctx = Object.keys(marketingContext).length > 0
    ? JSON.stringify(marketingContext, null, 2)
    : 'Contexto de marketing não preenchido.'

  return `Você é especialista em remodelagem de conteúdo para Instagram B2B.
Sua tarefa: analisar um roteiro transcrito e gerar versões adaptadas para o nicho do usuário.

Contexto do usuário:
${ctx}

Regras de resposta:
- Sempre em markdown com seções claras
- Direto ao ponto — sem fluff, sem introduções longas
- Cada versão adaptada deve citar pilar + objetivo + formato recomendado
- NUNCA conteúdo genérico — use nicho/produto/ICP do usuário injetado acima`
}

function buildUserPromptFromTranscript(userMessage: string, transcript: string, filename: string): string {
  const parts: string[] = []

  parts.push(`Arquivo de referência: ${filename}`)
  parts.push(`Plataforma de destino: Instagram`)
  parts.push(`\n## Roteiro transcrito\n${transcript.slice(0, 4000)}`)

  if (userMessage.trim()) {
    parts.push(`\nInstrução do usuário:\n${userMessage}`)
  }

  parts.push(`
---
Com base no roteiro acima, entregue:

## 🔍 Análise do Original
- **Hook type**: (Curiosidade / Contrariedade / Promessa / Dado / Pergunta)
- **Formato sugerido**: (Reel / Carrossel / Story)
- **Mecanismo psicológico**: o que faz funcionar
- **Estrutura**: como o roteiro está organizado
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

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const userMessage = (formData.get('userMessage') as string | null) ?? ''

  if (!file) return new Response('file obrigatório', { status: 400 })
  if (file.size > 25 * 1024 * 1024) {
    return new Response('Arquivo muito grande — máximo 25MB', { status: 400 })
  }

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
        send('🎙 **Transcrevendo áudio…**\n\n')

        const transcription = await openai.audio.transcriptions.create({
          model: 'whisper-1',
          file,
          language: 'pt',
        })

        const transcript = transcription.text

        if (!transcript || transcript.trim().length < 10) {
          send('⚠️ Não foi possível transcrever o áudio. Tente com um arquivo de melhor qualidade.\n\n')
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
          return
        }

        const wordCount = transcript.trim().split(/\s+/).length
        send(`✅ **Transcrição concluída (${wordCount} palavras). Analisando…**\n\n---\n\n`)

        const systemPrompt = buildSystemPrompt(marketingContext)
        const userPrompt = buildUserPromptFromTranscript(userMessage, transcript, file.name)

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
