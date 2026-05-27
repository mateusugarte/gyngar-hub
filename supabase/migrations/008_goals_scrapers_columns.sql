-- Migration 008: Colunas expandidas de metas e scrapers por função
-- Aplicar manualmente no Supabase SQL Editor

-- Novas colunas em user_goals (necessário para settings de metas)
ALTER TABLE user_goals
  ADD COLUMN IF NOT EXISTS posts_semana_meta integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS seguidores_meta integer DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS taxa_conversao_meta integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS faturamento_meta numeric DEFAULT 0;

-- Colunas de scraper por função em user_settings (cada funcionalidade tem sua própria chave)
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS apify_remodel_key text,
  ADD COLUMN IF NOT EXISTS apify_remodel_config jsonb,
  ADD COLUMN IF NOT EXISTS apify_search_key text,
  ADD COLUMN IF NOT EXISTS apify_search_config jsonb,
  ADD COLUMN IF NOT EXISTS apify_followers_key text,
  ADD COLUMN IF NOT EXISTS apify_followers_config jsonb,
  ADD COLUMN IF NOT EXISTS apify_comments_key text,
  ADD COLUMN IF NOT EXISTS apify_comments_config jsonb;
