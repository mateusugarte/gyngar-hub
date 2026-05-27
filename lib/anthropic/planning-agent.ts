import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function streamPlanningAgent(
  marketingContext: Record<string, unknown>,
  onChunk: (text: string) => void,
  model = 'gpt-4o'
): Promise<void> {
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

  const stream = await client.chat.completions.create({
    model,
    max_tokens: 4000,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Crie meu planejamento de conteúdo mensal personalizado para o Instagram.' },
    ],
    stream: true,
  })

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content
    if (text) onChunk(text)
  }
}

export async function generateIdeaWithAI(
  idea: { titulo: string; tipo: string; pilar: string; objetivo: string },
  marketingContext: Record<string, unknown>,
  model = 'gpt-4o'
): Promise<{ hook_ideas: string[]; cta_ideas: string[]; roteiro_sugestao: string; hashtags: string[]; legenda: string }> {
  const response = await client.chat.completions.create({
    model,
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `Você é um criador de conteúdo B2B para Instagram.

Contexto de marketing do usuário:
${JSON.stringify(marketingContext, null, 2)}

Ideia de post:
- Título: ${idea.titulo}
- Tipo: ${idea.tipo}
- Pilar: ${idea.pilar}
- Objetivo: ${idea.objetivo}

Gere sugestões criativas e retorne APENAS JSON válido (sem markdown):
{
  "hook_ideas": ["hook 1", "hook 2", "hook 3"],
  "cta_ideas": ["cta 1", "cta 2"],
  "roteiro_sugestao": "roteiro completo do vídeo ou estrutura do carrossel",
  "hashtags": ["hashtag1", "hashtag2", ...máx 10],
  "legenda": "legenda completa com emojis e CTA"
}`,
      },
    ],
  })

  const text = response.choices[0]?.message?.content ?? '{}'
  return JSON.parse(text)
}
