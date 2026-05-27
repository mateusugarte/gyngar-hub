'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { PlannedSlot } from './planning/distribute'

export async function saveMarketingContext(context: Record<string, unknown>): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('user_marketing_context')
    .upsert({ user_id: user.id, context: context as import('@/types/database.types').Json, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })

  if (error) return { error: error.message }
  revalidatePath('/content')
  return { error: null }
}

export async function createContentIdea(data: {
  titulo: string
  tipo: string
  pilar: string
  objetivo: string
  hook_ideas?: string[]
  cta_ideas?: string[]
  roteiro_sugestao?: string
  hashtags?: string[]
  legenda?: string
  palavra_isca?: string
  oferta_isca?: string
  data_agendada?: string
}): Promise<{ error: string | null; id?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: idea, error } = await supabase
    .from('content_ideas')
    .insert({ user_id: user.id, ...data })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/content')
  return { error: null, id: idea.id }
}

export async function updateContentIdea(id: string, data: Record<string, unknown>): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('content_ideas')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/content')
  return { error: null }
}

export async function deleteContentIdea(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('content_ideas')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/content')
  return { error: null }
}

export async function saveMonthlyPlan(slots: PlannedSlot[]): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  for (const slot of slots) {
    let ideaId = slot.idea_id

    // Create stub idea if none assigned
    if (!ideaId) {
      const { data: newIdea, error: ideaErr } = await supabase
        .from('content_ideas')
        .insert({
          user_id: user.id,
          titulo: `${slot.pilar} — ${slot.date}`,
          tipo: slot.tipo,
          pilar: slot.pilar,
          objetivo: slot.pilar === 'engajamento' ? 'isca' : 'autoridade',
          status: 'ideia' as const,
          data_agendada: slot.date,
        })
        .select('id')
        .single()
      if (ideaErr || !newIdea) continue
      ideaId = newIdea.id
    }

    await supabase
      .from('content_calendar')
      .insert({ user_id: user.id, idea_id: ideaId, data_planejada: slot.date, status: 'agendado' as const })

    // Mark idea as agendado
    await supabase
      .from('content_ideas')
      .update({ status: 'agendado' as const, data_agendada: slot.date })
      .eq('id', ideaId)
      .eq('user_id', user.id)
  }

  revalidatePath('/content')
  revalidatePath('/content/calendar')
  return { error: null }
}

export async function scheduleIdea(ideaId: string, date: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('content_calendar')
    .upsert(
      { user_id: user.id, idea_id: ideaId, data_planejada: date, status: 'agendado' as const },
      { onConflict: 'user_id,idea_id' }
    )

  if (error) return { error: error.message }
  await supabase
    .from('content_ideas')
    .update({ status: 'agendado', data_agendada: date })
    .eq('id', ideaId)
    .eq('user_id', user.id)

  revalidatePath('/content')
  revalidatePath('/content/calendar')
  return { error: null }
}

export async function removeFromCalendar(entryId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  // Get idea_id before deleting so we can reset its status
  const { data: entry } = await supabase
    .from('content_calendar')
    .select('idea_id')
    .eq('id', entryId)
    .eq('user_id', user.id)
    .single()

  const { error } = await supabase
    .from('content_calendar')
    .delete()
    .eq('id', entryId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  // Reset idea status back to 'ideia' if it was linked
  if (entry?.idea_id) {
    await supabase
      .from('content_ideas')
      .update({ status: 'ideia' as const, data_agendada: null })
      .eq('id', entry.idea_id)
      .eq('user_id', user.id)
  }

  revalidatePath('/content')
  revalidatePath('/content/calendar')
  return { error: null }
}
