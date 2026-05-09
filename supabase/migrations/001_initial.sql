-- ═══════════════════════════════════════════════
-- GYNGAR.HUB — Migration 001: Schema inicial
-- ═══════════════════════════════════════════════

-- Extensão para criptografia
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ───────────────────────────────────────────────
-- ENUMS
-- ───────────────────────────────────────────────

CREATE TYPE origem_lead AS ENUM (
  'instagram_comentario',
  'instagram_seguidor',
  'google_maps',
  'linkedin',
  'manual',
  'indicacao'
);

CREATE TYPE etapa_pipeline AS ENUM (
  'primeiro_contato',
  'possivel_interesse',
  'reuniao_agendada',
  'venda_concluida',
  'follow_up',
  'recusa'
);

CREATE TYPE score_lead AS ENUM ('A', 'B', 'C');

CREATE TYPE status_content AS ENUM (
  'ideia',
  'producao',
  'agendado',
  'publicado',
  'cancelado'
);

CREATE TYPE status_job AS ENUM (
  'pendente',
  'rodando',
  'concluido',
  'erro'
);

CREATE TYPE fonte_job AS ENUM (
  'ig_comentarios',
  'ig_seguidores',
  'google_maps',
  'linkedin'
);

CREATE TYPE tipo_notificacao AS ENUM (
  'lead_parado',
  'job_concluido',
  'token_expirando',
  'post_hora',
  'meta_atingida'
);

CREATE TYPE plano AS ENUM ('free', 'pro', 'enterprise');

-- ───────────────────────────────────────────────
-- TABELAS
-- ───────────────────────────────────────────────

-- Configurações do usuário (criada automaticamente via trigger)
CREATE TABLE public.user_settings (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  apify_api_key         text,
  ig_access_token       text,
  ig_account_id         text,
  plan_tier             plano NOT NULL DEFAULT 'free',
  onboarding_completed  boolean NOT NULL DEFAULT false,
  onboarding_step       integer NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Contexto de marketing (8 dimensões)
CREATE TABLE public.user_marketing_context (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  context    jsonb NOT NULL DEFAULT '{}',
  -- context keys: produto, icp_firm, icp_psico, persona,
  --               diferencial, voz_marca, jtbd, prova_social
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Metas do usuário
CREATE TABLE public.user_goals (
  id                       uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reunioes_meta            integer NOT NULL DEFAULT 0,
  vendas_meta              integer NOT NULL DEFAULT 0,
  prospeccoes_diarias_meta integer NOT NULL DEFAULT 0,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Etapas do pipeline (referência das colunas Kanban)
CREATE TABLE public.pipeline_stages (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  etapa      etapa_pipeline NOT NULL,
  ordem      integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Leads qualificados (pipeline principal)
CREATE TABLE public.leads_qualified (
  id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome               text,
  telefone           text,
  instagram          text,
  email              text,
  empresa            text,
  nicho              text,
  porte              text,
  cidade             text,
  site               text,
  origem             origem_lead,
  origem_detalhe     jsonb DEFAULT '{}',
  etapa              etapa_pipeline NOT NULL DEFAULT 'primeiro_contato',
  data_entrada_etapa timestamptz NOT NULL DEFAULT now(),
  proxima_acao       jsonb DEFAULT '{}',
  valor_potencial    numeric(10,2),
  score              score_lead,
  observacoes        text,
  tags               text[] DEFAULT '{}',
  alerta_parado      boolean NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, instagram),
  UNIQUE(user_id, telefone)
);

-- Leads captados via posts isca
CREATE TABLE public.leads_instagram (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ig_username  text NOT NULL,
  post_id      text,
  comentario   text,
  palavra_isca text,
  data_captura timestamptz NOT NULL DEFAULT now(),
  convertido   boolean NOT NULL DEFAULT false
);

-- Leads brutos do Apify (antes do enriquecimento)
CREATE TABLE public.leads_raw (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_handle text,
  dados_brutos     jsonb NOT NULL DEFAULT '{}',
  processado       boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, instagram_handle)
);

-- Jobs de scraping (Apify)
CREATE TABLE public.scraping_jobs (
  id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  apify_run_id       text,
  fonte              fonte_job NOT NULL,
  status             status_job NOT NULL DEFAULT 'pendente',
  filtros            jsonb DEFAULT '{}',
  total_coletado     integer DEFAULT 0,
  total_qualificados integer DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- Ideias de conteúdo
CREATE TABLE public.content_ideas (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo           text NOT NULL,
  tipo             text,
  pilar            text,
  objetivo         text,
  hook_ideas       text[] DEFAULT '{}',
  cta_ideas        text[] DEFAULT '{}',
  roteiro_sugestao text,
  hashtags         text[] DEFAULT '{}',
  legenda          text,
  palavra_isca     text,
  oferta_isca      text,
  status           status_content NOT NULL DEFAULT 'ideia',
  data_agendada    timestamptz,
  ig_media_id      text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Calendário de conteúdo
CREATE TABLE public.content_calendar (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id             uuid REFERENCES public.content_ideas(id) ON DELETE SET NULL,
  data_planejada      date NOT NULL,
  status              status_content NOT NULL DEFAULT 'agendado',
  notificacao_enviada boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Posts do Instagram (sincronizados via Graph API)
CREATE TABLE public.instagram_posts (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ig_media_id     text NOT NULL,
  tipo            text,
  caption         text,
  impressions     integer DEFAULT 0,
  views           integer DEFAULT 0,
  likes           integer DEFAULT 0,
  comments_count  integer DEFAULT 0,
  saved           integer DEFAULT 0,
  data_publicacao timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, ig_media_id)
);

-- Comentários do Instagram
CREATE TABLE public.instagram_comments (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ig_comment_id       text NOT NULL,
  post_id             uuid REFERENCES public.instagram_posts(id) ON DELETE CASCADE,
  autor_ig            text,
  texto               text,
  data                timestamptz,
  contem_palavra_isca boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, ig_comment_id)
);

-- Conversas do chat IA
CREATE TABLE public.chat_conversations (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo     text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Mensagens do chat IA
CREATE TABLE public.chat_messages (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            text NOT NULL CHECK (role IN ('user', 'assistant')),
  content         text NOT NULL,
  tokens_usados   integer DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Log de uso do chat (rate limiting)
CREATE TABLE public.chat_usage_logs (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date           date NOT NULL,
  total_tokens   integer NOT NULL DEFAULT 0,
  total_messages integer NOT NULL DEFAULT 0,
  UNIQUE(user_id, date)
);

-- Notificações centralizadas
CREATE TABLE public.notifications (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo         tipo_notificacao NOT NULL,
  titulo       text NOT NULL,
  mensagem     text NOT NULL,
  lida         boolean NOT NULL DEFAULT false,
  link_destino text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ───────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ───────────────────────────────────────────────

ALTER TABLE public.user_settings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_marketing_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads_qualified        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads_instagram        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads_raw              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraping_jobs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_ideas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_calendar       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_posts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_comments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_usage_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications          ENABLE ROW LEVEL SECURITY;

-- Policy padrão: isolamento por user_id
CREATE POLICY "user_isolation" ON public.user_settings
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation" ON public.user_marketing_context
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation" ON public.user_goals
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation" ON public.pipeline_stages
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation" ON public.leads_qualified
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation" ON public.leads_instagram
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation" ON public.leads_raw
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation" ON public.scraping_jobs
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation" ON public.content_ideas
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation" ON public.content_calendar
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation" ON public.instagram_posts
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation" ON public.instagram_comments
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation" ON public.chat_conversations
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation" ON public.chat_messages
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation" ON public.chat_usage_logs
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation" ON public.notifications
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ───────────────────────────────────────────────
-- FUNÇÕES E TRIGGERS
-- ───────────────────────────────────────────────

-- Trigger: atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_marketing_context
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.leads_qualified
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.scraping_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.content_ideas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger: cria registros relacionados ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id) VALUES (NEW.id);
  INSERT INTO public.user_marketing_context (user_id) VALUES (NEW.id);
  INSERT INTO public.user_goals (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
