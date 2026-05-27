import OpenAI from 'openai'

export interface PostEvaluationInput {
  tipo: string | null
  caption: string | null
  likes: number
  comments_count: number
  saved: number
  reach: number
  views: number            // total_interactions
  video_plays: number      // plays reais do reel (0 se não for reel)
  reach_followers: number
  reach_non_followers: number
  avg_watch_time_ms: number
  data_publicacao: string | null
  marketingContext?: Record<string, unknown>
}

export interface PostEvaluation {
  status: 'deu_certo' | 'flopou'
  score: number            // 0–100
  resumo: string           // frase curta do resultado
  analise: string          // análise completa em parágrafos
  o_que_funcionou: string  // vazio se flopou
  o_que_melhorar: string[]
  proximo_passo: string
}

export async function evaluatePost(input: PostEvaluationInput, model = 'gpt-4o'): Promise<PostEvaluation> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const engagement = input.likes + input.comments_count + input.saved
  const engRate = input.reach > 0 ? ((engagement / input.reach) * 100).toFixed(2) : '0'
  const totalReachBreakdown = input.reach_followers + input.reach_non_followers
  const followerPct = totalReachBreakdown > 0
    ? ((input.reach_followers / totalReachBreakdown) * 100).toFixed(0)
    : null
  const nonFollowerPct = totalReachBreakdown > 0
    ? ((input.reach_non_followers / totalReachBreakdown) * 100).toFixed(0)
    : null
  const avgWatchSec = input.avg_watch_time_ms > 0
    ? (input.avg_watch_time_ms / 1000).toFixed(1)
    : null

  const isReel = input.tipo === 'REEL'

  const systemPrompt = `Você é um especialista sênior em marketing de conteúdo para Instagram, com domínio em análise de performance de posts para contas Business/Creator.

Sua função é avaliar posts com base em métricas reais e no contexto do negócio do usuário, entregando análises precisas, honestas e acionáveis em português brasileiro.

CRITÉRIOS DE AVALIAÇÃO (use como referência, não regra absoluta — contexto importa):
- Taxa de engajamento ≥ 6%: excelente
- Taxa de engajamento 3–6%: bom
- Taxa de engajamento 1–3%: fraco
- Taxa de engajamento < 1%: flopou
- Alcance de não-seguidores > 50%: boa viralização
- Salvos > 1% do alcance: conteúdo de alto valor percebido
- Para Reels: watch time > 50% da duração é muito bom

REGRAS DE OUTPUT:
- Responda APENAS com JSON válido, sem markdown nem texto fora do JSON
- Seja direto e honesto — não suavize um flopp
- Sugestões devem ser específicas e acionáveis, não genéricas`

  const metricsBlock = [
    `- Tipo: ${input.tipo ?? 'Desconhecido'}`,
    `- Data: ${input.data_publicacao?.slice(0, 10) ?? 'N/A'}`,
    `- Alcance total: ${input.reach} contas`,
    followerPct !== null ? `- Alcance por seguidores: ${input.reach_followers} (${followerPct}%)` : null,
    nonFollowerPct !== null ? `- Alcance por não-seguidores: ${input.reach_non_followers} (${nonFollowerPct}%)` : null,
    `- Curtidas: ${input.likes}`,
    `- Comentários: ${input.comments_count}`,
    `- Salvos: ${input.saved}`,
    `- Taxa de engajamento: ${engRate}%`,
    isReel && input.video_plays > 0 ? `- Visualizações (plays): ${input.video_plays}` : null,
    avgWatchSec ? `- Tempo médio de visualização: ${avgWatchSec}s` : null,
  ].filter(Boolean).join('\n')

  const contextBlock = input.marketingContext && Object.keys(input.marketingContext).length > 0
    ? `\nCONTEXTO DO NEGÓCIO:\n${JSON.stringify(input.marketingContext, null, 2)}`
    : ''

  const captionBlock = input.caption
    ? `\nLEGENDA DO POST:\n"${input.caption.slice(0, 600)}${input.caption.length > 600 ? '...' : ''}"`
    : '\nLEGENDA: (sem legenda)'

  const userPrompt = `Avalie este post do Instagram:

MÉTRICAS:
${metricsBlock}
${captionBlock}
${contextBlock}

Retorne EXATAMENTE este JSON (sem explicação fora dele):
{
  "status": "deu_certo" ou "flopou",
  "score": número inteiro de 0 a 100,
  "resumo": "frase de até 15 palavras descrevendo o resultado",
  "analise": "análise completa em 2-3 parágrafos explicando o desempenho — o que os números dizem, o comportamento do público e o contexto",
  "o_que_funcionou": "o que contribuiu positivamente para o resultado (string vazia se flopou completamente)",
  "o_que_melhorar": ["sugestão específica 1", "sugestão específica 2", "sugestão específica 3"],
  "proximo_passo": "ação concreta e específica para o próximo post baseada nesta análise"
}`

  const response = await client.chat.completions.create({
    model,
    max_tokens: 1500,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  })

  const text = response.choices[0]?.message?.content ?? '{}'
  const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim()
  return JSON.parse(cleaned) as PostEvaluation
}
