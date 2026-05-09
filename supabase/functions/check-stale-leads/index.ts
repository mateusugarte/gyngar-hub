// Edge Function: check-stale-leads
// CRON: 0 9 * * * (todo dia às 9h)
// Marca leads parados com alerta_parado = 'amarelo' (5-9 dias) ou 'vermelho' (10+ dias)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const now = new Date()

    const threshold10 = new Date(now)
    threshold10.setDate(threshold10.getDate() - 10)

    const threshold5 = new Date(now)
    threshold5.setDate(threshold5.getDate() - 5)

    // Marcar vermelho: parado 10+ dias
    const { error: redError } = await supabase
      .from('leads_qualified')
      .update({ alerta_parado: 'vermelho' })
      .neq('etapa', 'recusa')
      .lte('data_entrada_etapa', threshold10.toISOString())

    if (redError) throw redError

    // Marcar amarelo: parado 5-9 dias (apenas quem ainda não é vermelho)
    const { error: yellowError } = await supabase
      .from('leads_qualified')
      .update({ alerta_parado: 'amarelo' })
      .neq('etapa', 'recusa')
      .lte('data_entrada_etapa', threshold5.toISOString())
      .gt('data_entrada_etapa', threshold10.toISOString())
      .is('alerta_parado', null)

    if (yellowError) throw yellowError

    // Limpar alertas de leads que foram movidos recentemente (< 5 dias)
    const { error: clearError } = await supabase
      .from('leads_qualified')
      .update({ alerta_parado: null })
      .neq('etapa', 'recusa')
      .gt('data_entrada_etapa', threshold5.toISOString())
      .not('alerta_parado', 'is', null)

    if (clearError) throw clearError

    return new Response(
      JSON.stringify({ ok: true, ran_at: now.toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
