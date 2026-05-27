'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markNotificationRead(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('notifications')
    .update({ lida: true })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { error: null }
}

export async function markAllNotificationsRead(): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('notifications')
    .update({ lida: true })
    .eq('user_id', user.id)
    .eq('lida', false)

  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { error: null }
}
