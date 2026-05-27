import { createClient } from '@/lib/supabase/server'
import { SettingsApify } from './components/settings-apify'
import { SettingsGoals } from './components/settings-goals'
import { SettingsInstagram } from './components/settings-instagram'
import { IgPageSelector } from './components/ig-page-selector'
import { SettingsAiModel } from './components/settings-ai-model'
import { SettingsScrapers, type ScraperConfigs } from './components/settings-scrapers'
import type { AiModel, GoalsData } from './actions'

interface SettingsPageProps {
  searchParams: Promise<{
    ig_success?: string
    ig_error?: string
    ig_user?: string
    ig_select?: string
  }>
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const supabase = await createClient()
  const params = await searchParams

  const [settingsResult, goalsResult] = await Promise.all([
    supabase.from('user_settings').select('*').single(),
    supabase.from('user_goals').select('*').single(),
  ])

  const settings = settingsResult.data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = settings as any

  const aiModel = (s?.ai_model ?? 'gpt-4o') as AiModel
  const connected = !!(settings?.ig_access_token && settings?.ig_account_id)
  const showSelector = params.ig_select === '1' && !connected
  const envConfigured = !!(process.env.META_APP_ID && process.env.META_APP_SECRET && process.env.NEXT_PUBLIC_APP_URL)
  const igSuccess = params.ig_success === '1'
    ? `Instagram conectado com sucesso${params.ig_user ? ` — ${decodeURIComponent(params.ig_user)}` : ''}!`
    : null
  const igError = params.ig_error ? decodeURIComponent(params.ig_error) : null
  const igUsername = s?.ig_username as string | null ?? null

  const scrapers: ScraperConfigs = {
    remodel:   { key: s?.apify_remodel_key ?? null,   config: s?.apify_remodel_config ?? null },
    search:    { key: s?.apify_search_key ?? null,    config: s?.apify_search_config ?? null },
    followers: { key: s?.apify_followers_key ?? null, config: s?.apify_followers_config ?? null },
    comments:  { key: s?.apify_comments_key ?? null,  config: s?.apify_comments_config ?? null },
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const goals = goalsResult.data as Partial<GoalsData> | null

  return (
    <div className="max-w-2xl mx-auto p-8 flex flex-col gap-8 anim-page">
      <span
        className="font-mono text-[10px] uppercase tracking-[0.1em]"
        style={{ color: 'var(--text-secondary)' }}
      >
        CONFIGURAÇÕES
      </span>

      {showSelector ? (
        <IgPageSelector />
      ) : (
        <SettingsInstagram
          connected={connected}
          accountId={settings?.ig_account_id ?? null}
          igUsername={igUsername}
          successMsg={igSuccess}
          errorMsg={igError}
          envConfigured={envConfigured}
        />
      )}

      <SettingsApify initialKey={settings?.apify_api_key ?? ''} />

      <SettingsScrapers scrapers={scrapers} />

      <SettingsAiModel currentModel={aiModel} />

      <SettingsGoals goals={goals} />
    </div>
  )
}
