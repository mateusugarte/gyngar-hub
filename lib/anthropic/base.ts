import OpenAI from 'openai'

export function createOpenAIClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export const MODEL = 'gpt-4o'
export const MAX_TOKENS_IDEAS = 2000
export const MAX_TOKENS_PLANNING = 4000
