-- Adiciona campos extras de Instagram em user_settings
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS ig_username text,
  ADD COLUMN IF NOT EXISTS ig_token_expires_at timestamptz;

COMMENT ON COLUMN public.user_settings.ig_username IS 'Username público da conta IG (@handle)';
COMMENT ON COLUMN public.user_settings.ig_token_expires_at IS 'Expiração do long-lived token (~60 dias)';
