import { createClient } from '@/lib/supabase/server'
import { SettingsApify } from './components/settings-apify'
import { SettingsGoals } from './components/settings-goals'

export default async function SettingsPage() {
  const supabase = await createClient()

  const [settingsResult, goalsResult] = await Promise.all([
    supabase.from('user_settings').select('*').single(),
    supabase.from('user_goals').select('*').single(),
  ])

  return (
    <div className="max-w-2xl mx-auto p-8 flex flex-col gap-8">
      <span
        className="font-mono text-[10px] uppercase tracking-[0.1em]"
        style={{ color: 'var(--text-secondary)' }}
      >
        CONFIGURAÇÕES
      </span>

      {/* Instagram — placeholder, OAuth na Etapa 2 */}
      <section
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <span
          className="font-mono text-[10px] uppercase tracking-[0.1em] block mb-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          INSTAGRAM
        </span>
        <p className="text-sm font-sans mb-4" style={{ color: 'var(--text-primary)' }}>
          {settingsResult.data?.ig_account_id
            ? `Conta conectada: @${settingsResult.data.ig_account_id}`
            : 'Nenhuma conta conectada.'}
        </p>
        <button
          disabled
          className="px-4 py-2 rounded-lg text-sm font-sans"
          style={{
            border: '1px solid var(--border-visible)',
            color: 'var(--text-disabled)',
            background: 'var(--bg-base)',
            cursor: 'not-allowed',
          }}
        >
          Conectar Instagram (Etapa 2)
        </button>
      </section>

      <SettingsApify initialKey={settingsResult.data?.apify_api_key ?? ''} />

      <SettingsGoals goals={goalsResult.data as { reunioes_meta: number; vendas_meta: number; prospeccoes_diarias_meta: number } | null} />
    </div>
  )
}
