-- Migration 005: Enriquece instagram_posts com reach, shares e URLs de mídia

ALTER TABLE public.instagram_posts
  ADD COLUMN IF NOT EXISTS reach        integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shares       integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS media_url    text,
  ADD COLUMN IF NOT EXISTS permalink    text;

COMMENT ON COLUMN public.instagram_posts.reach         IS 'Contas únicas que viram o post (alcance)';
COMMENT ON COLUMN public.instagram_posts.shares        IS 'Número de compartilhamentos';
COMMENT ON COLUMN public.instagram_posts.thumbnail_url IS 'Thumbnail (vídeos/reels)';
COMMENT ON COLUMN public.instagram_posts.media_url     IS 'URL pública da imagem/vídeo';
COMMENT ON COLUMN public.instagram_posts.permalink     IS 'Link direto para o post no Instagram';
