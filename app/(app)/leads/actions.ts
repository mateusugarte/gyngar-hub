'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ─── Schemas ────────────────────────────────────────────────────────────────

const proximaAcaoSchema = z.object({
  tipo: z.enum(['ligacao', 'mensagem', 'reuniao', 'email']).optional(),
  data: z.string().optional(),
  descricao: z.string().optional(),
}).optional()

const leadSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().min(1, 'Nome obrigatório'),
  telefone: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  empresa: z.string().optional().nullable(),
  nicho: z.string().optional().nullable(),
  porte: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  site: z.string().optional().nullable(),
  etapa: z.enum(['primeiro_contato', 'possivel_interesse', 'reuniao_agendada', 'venda_concluida', 'follow_up', 'recusa']).default('primeiro_contato'),
  score: z.enum(['A', 'B', 'C']).optional().nullable(),
  valor_potencial: z.coerce.number().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  proxima_acao: proximaAcaoSchema,
})

export type LeadFormData = z.infer<typeof leadSchema>

export interface LeadActionState {
  error: string | null
  success?: boolean
}

// ─── moveLeadAction ──────────────────────────────────────────────────────────

export async function moveLeadAction(
  leadId: string,
  novaEtapa: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('leads_qualified')
    .update({
      etapa: novaEtapa as LeadFormData['etapa'],
      data_entrada_etapa: new Date().toISOString(),
      alerta_parado: null,
    })
    .eq('id', leadId)

  if (error) return { error: error.message }

  revalidatePath('/leads')
  return { error: null }
}

// ─── saveLeadAction ──────────────────────────────────────────────────────────

export async function saveLeadAction(
  _prevState: LeadActionState,
  formData: FormData
): Promise<LeadActionState> {
  const raw = {
    id: formData.get('id') as string | undefined,
    nome: formData.get('nome'),
    telefone: formData.get('telefone') || null,
    instagram: formData.get('instagram') || null,
    email: formData.get('email') || null,
    empresa: formData.get('empresa') || null,
    nicho: formData.get('nicho') || null,
    porte: formData.get('porte') || null,
    cidade: formData.get('cidade') || null,
    site: formData.get('site') || null,
    etapa: formData.get('etapa') || 'primeiro_contato',
    score: formData.get('score') || null,
    valor_potencial: formData.get('valor_potencial') || null,
    observacoes: formData.get('observacoes') || null,
    tags: formData.getAll('tags') as string[],
    proxima_acao: formData.get('proxima_acao')
      ? JSON.parse(formData.get('proxima_acao') as string)
      : undefined,
  }

  const parsed = leadSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { id, ...rest } = parsed.data

  if (id) {
    const { error } = await supabase
      .from('leads_qualified')
      .update({ ...rest, email: rest.email || null })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('leads_qualified')
      .insert({ ...rest, email: rest.email || null, user_id: user.id })

    if (error) return { error: error.message }
  }

  revalidatePath('/leads')
  return { error: null, success: true }
}

// ─── deleteLeadAction ────────────────────────────────────────────────────────

export async function deleteLeadAction(leadId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('leads_qualified')
    .delete()
    .eq('id', leadId)

  if (error) return { error: error.message }

  revalidatePath('/leads')
  return { error: null }
}
