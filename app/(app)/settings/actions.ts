'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export interface ActionState {
  error: string | null
  success: boolean
}

const apifySchema = z.object({
  apify_api_key: z.string().min(1, 'Chave não pode ser vazia'),
})

export async function saveApifyKeyAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = apifySchema.safeParse({ apify_api_key: formData.get('apify_api_key') })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, success: false }
  }

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

const goalsSchema = z.object({
  reunioes_meta:            z.coerce.number().int().min(0),
  vendas_meta:              z.coerce.number().int().min(0),
  prospeccoes_diarias_meta: z.coerce.number().int().min(0),
})

export async function saveGoalsAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = goalsSchema.safeParse({
    reunioes_meta:            formData.get('reunioes_meta'),
    vendas_meta:              formData.get('vendas_meta'),
    prospeccoes_diarias_meta: formData.get('prospeccoes_diarias_meta'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, success: false }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autenticado', success: false }

  const { error } = await supabase
    .from('user_goals')
    .update(parsed.data)
    .eq('user_id', user.id)

  if (error) return { error: error.message, success: false }

  revalidatePath('/settings')
  return { error: null, success: true }
}
