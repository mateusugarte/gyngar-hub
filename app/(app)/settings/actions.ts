'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export interface ActionState {
  error: string | null
  success: boolean
}

// ─── Apify global key ────────────────────────────────────────────────────────

const apifySchema = z.object({
  apify_api_key: z.string().min(1, 'Chave não pode ser vazia'),
})

export async function saveApifyKeyAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = apifySchema.safeParse({ apify_api_key: formData.get('apify_api_key') })
  if (!parsed.success) return { error: parsed.error.issues[0].message, success: false }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado', success: false }

  const { error } = await supabase
    .from('user_settings')
    .update({ apify_api_key: parsed.data.apify_api_key })
    .eq('user_id', user.id)

  if (error) return { error: error.message, success: false }
  revalidatePath('/settings')
  return { error: null, success: true }
}

// ─── Scraper por função ──────────────────────────────────────────────────────

const VALID_SCRAPERS = ['remodel', 'search', 'followers', 'comments'] as const
type ScraperId = typeof VALID_SCRAPERS[number]

export async function saveScraperAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const scraperId = formData.get('scraper_id') as string
  if (!VALID_SCRAPERS.includes(scraperId as ScraperId)) {
    return { error: 'Scraper inválido', success: false }
  }

  const apiKey = (formData.get('api_key') as string)?.trim()
  const rawConfig = (formData.get('config') as string)?.trim()

  if (!apiKey) return { error: 'Chave de API obrigatória', success: false }

  let config: Record<string, unknown> | null = null
  if (rawConfig) {
    try {
      config = JSON.parse(rawConfig)
      if (typeof config !== 'object' || Array.isArray(config)) throw new Error()
    } catch {
      return { error: 'JSON inválido — verifique a formatação', success: false }
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado', success: false }

  const update: Record<string, unknown> = {
    [`apify_${scraperId}_key`]: apiKey,
  }
  if (config !== null) {
    update[`apify_${scraperId}_config`] = config
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('user_settings')
    .update(update)
    .eq('user_id', user.id)

  if (error) return { error: error.message, success: false }
  revalidatePath('/settings')
  return { error: null, success: true }
}

// ─── AI model ────────────────────────────────────────────────────────────────

const AI_MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini'] as const
export type AiModel = typeof AI_MODELS[number]

export async function saveAiModelAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const model = formData.get('ai_model') as string
  if (!AI_MODELS.includes(model as AiModel)) {
    return { error: 'Modelo inválido', success: false }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado', success: false }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('user_settings')
    .update({ ai_model: model })
    .eq('user_id', user.id)

  if (error) return { error: error.message, success: false }
  revalidatePath('/settings')
  return { error: null, success: true }
}

// ─── Metas ───────────────────────────────────────────────────────────────────

const goalsSchema = z.object({
  reunioes_meta:            z.coerce.number().int().min(0),
  vendas_meta:              z.coerce.number().int().min(0),
  prospeccoes_diarias_meta: z.coerce.number().int().min(0),
  posts_semana_meta:        z.coerce.number().int().min(0),
  seguidores_meta:          z.coerce.number().int().min(0),
  taxa_conversao_meta:      z.coerce.number().int().min(0).max(100),
  faturamento_meta:         z.coerce.number().min(0),
})

export type GoalsData = z.infer<typeof goalsSchema>

export async function saveGoalsAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = goalsSchema.safeParse({
    reunioes_meta:            formData.get('reunioes_meta'),
    vendas_meta:              formData.get('vendas_meta'),
    prospeccoes_diarias_meta: formData.get('prospeccoes_diarias_meta'),
    posts_semana_meta:        formData.get('posts_semana_meta'),
    seguidores_meta:          formData.get('seguidores_meta'),
    taxa_conversao_meta:      formData.get('taxa_conversao_meta'),
    faturamento_meta:         formData.get('faturamento_meta'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, success: false }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado', success: false }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('user_goals')
    .update(parsed.data)
    .eq('user_id', user.id)

  if (error) return { error: error.message, success: false }
  revalidatePath('/settings')
  return { error: null, success: true }
}
