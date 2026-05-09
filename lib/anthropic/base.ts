import Anthropic from '@anthropic-ai/sdk'

export function createAnthropicClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

export const MODEL = 'claude-sonnet-4-20250514'
export const MAX_TOKENS_IDEAS = 2000
export const MAX_TOKENS_PLANNING = 4000
