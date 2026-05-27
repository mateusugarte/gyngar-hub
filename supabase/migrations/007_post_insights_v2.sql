-- Migration 007: métricas avançadas por post + avaliação IA

ALTER TABLE public.instagram_posts
  ADD COLUMN IF NOT EXISTS video_plays       bigint  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reach_followers   integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reach_non_followers integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_watch_time_ms bigint  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_evaluation     jsonb;
