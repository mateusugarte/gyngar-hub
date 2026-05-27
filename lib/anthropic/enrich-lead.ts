import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface RawLead {
  nome?: string
  instagram?: string
  telefone?: string
  email?: string
  empresa?: string
  nicho?: string
  cidade?: string
  site?: string
  descricao?: string
  seguidores?: number
  fonte: 'ig_comentarios' | 'ig_seguidores' | 'google_maps'
}

export interface EnrichedLead {
  nome: string
  instagram?: string
  telefone?: string
  email?: string
  empresa?: string
  nicho?: string
  cidade?: string
  site?: string
  score: 'A' | 'B' | 'C'
  qualificado: boolean
  observacoes: string
}

export async function enrichLead(
  raw: RawLead,
  marketingContext: Record<string, unknown>,
  model = 'gpt-4o'
): Promise<EnrichedLead> {
  const prompt = `Você é um qualificador de leads B2B. Analise este lead e classifique com base no ICP do usuário.

ICP do usuário:
${JSON.stringify(marketingContext, null, 2)}

Lead a avaliar:
${JSON.stringify(raw, null, 2)}

Retorne APENAS um JSON válido (sem markdown, sem texto extra) com esta estrutura:
{
  "nome": string,
  "instagram": string | null,
  "telefone": string | null,
  "email": string | null,
  "empresa": string | null,
  "nicho": string | null,
  "cidade": string | null,
  "site": string | null,
  "score": "A" | "B" | "C",
  "qualificado": boolean,
  "observacoes": string (1-2 frases explicando o score)
}

Critérios:
- Score A: fit perfeito com ICP, alta probabilidade de conversão
- Score B: fit parcial, vale prospectar com cautela
- Score C: fit baixo, pouco alinhado com ICP
- qualificado: true para A ou B, false para C`

  const response = await client.chat.completions.create({
    model,
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.choices[0]?.message?.content ?? ''
  return JSON.parse(text) as EnrichedLead
}
