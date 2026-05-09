-- Migration 003: RPC para métricas do Dashboard
-- Retorna JSON com todas as métricas de uma vez (evita N+1 queries)

CREATE OR REPLACE FUNCTION public.get_dashboard_metrics(
  p_user_id uuid,
  p_start   timestamptz,
  p_end     timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;

  -- Pipeline
  v_leads_total         integer;
  v_leads_ig            integer;
  v_leads_google        integer;
  v_leads_score_ab      integer;
  v_reunioes            integer;
  v_vendas              integer;

  -- Metas
  v_reunioes_meta       integer;
  v_vendas_meta         integer;
  v_prospeccoes_meta    integer;

  -- Prospecção
  v_prospeccoes_feitas  integer;
  v_desqualificados     integer;

  -- Conteúdo
  v_posts_feitos        integer;
  v_leads_isca          integer;
  v_impressoes          bigint;
  v_engajamento_medio   numeric;

BEGIN
  -- Pipeline totais (período)
  SELECT
    COUNT(*) FILTER (WHERE etapa != 'recusa'),
    COUNT(*) FILTER (WHERE origem IN ('instagram_comentario','instagram_seguidor') AND etapa != 'recusa'),
    COUNT(*) FILTER (WHERE origem = 'google_maps' AND etapa != 'recusa'),
    COUNT(*) FILTER (WHERE score IN ('A','B') AND etapa != 'recusa'),
    COUNT(*) FILTER (WHERE etapa = 'reuniao_agendada'),
    COUNT(*) FILTER (WHERE etapa = 'venda_concluida')
  INTO v_leads_total, v_leads_ig, v_leads_google, v_leads_score_ab, v_reunioes, v_vendas
  FROM public.leads_qualified
  WHERE user_id = p_user_id
    AND created_at BETWEEN p_start AND p_end;

  -- Desqualificados (recusa no período)
  SELECT COUNT(*)
  INTO v_desqualificados
  FROM public.leads_qualified
  WHERE user_id = p_user_id
    AND etapa = 'recusa'
    AND created_at BETWEEN p_start AND p_end;

  -- Metas do usuário
  SELECT
    COALESCE(reunioes_meta, 8),
    COALESCE(vendas_meta, 4),
    COALESCE(prospeccoes_diarias_meta, 15)
  INTO v_reunioes_meta, v_vendas_meta, v_prospeccoes_meta
  FROM public.user_goals
  WHERE user_id = p_user_id
  LIMIT 1;

  -- Fallback se sem metas
  v_reunioes_meta    := COALESCE(v_reunioes_meta, 8);
  v_vendas_meta      := COALESCE(v_vendas_meta, 4);
  v_prospeccoes_meta := COALESCE(v_prospeccoes_meta, 15);

  -- Prospecções feitas (scraping_jobs concluídos no período)
  SELECT COUNT(*)
  INTO v_prospeccoes_feitas
  FROM public.scraping_jobs
  WHERE user_id = p_user_id
    AND status = 'concluido'
    AND created_at BETWEEN p_start AND p_end;

  -- Conteúdo: posts publicados
  SELECT COUNT(*)
  INTO v_posts_feitos
  FROM public.instagram_posts
  WHERE user_id = p_user_id
    AND data_publicacao BETWEEN p_start AND p_end;

  -- Leads isca (leads_instagram no período)
  SELECT COUNT(*)
  INTO v_leads_isca
  FROM public.leads_instagram
  WHERE user_id = p_user_id
    AND data_captura BETWEEN p_start AND p_end;

  -- Impressões totais no período
  SELECT COALESCE(SUM(impressions), 0)
  INTO v_impressoes
  FROM public.instagram_posts
  WHERE user_id = p_user_id
    AND data_publicacao BETWEEN p_start AND p_end;

  -- Engajamento médio (likes + comments + saved / impressions)
  SELECT COALESCE(
    AVG(
      CASE WHEN COALESCE(impressions, 0) > 0
        THEN (COALESCE(likes,0) + COALESCE(comments_count,0) + COALESCE(saved,0))::numeric
             / impressions::numeric * 100
        ELSE 0
      END
    ), 0
  )
  INTO v_engajamento_medio
  FROM public.instagram_posts
  WHERE user_id = p_user_id
    AND data_publicacao BETWEEN p_start AND p_end;

  -- Montar resultado
  v_result := jsonb_build_object(
    'pipeline', jsonb_build_object(
      'leads_total',     v_leads_total,
      'leads_ig',        v_leads_ig,
      'leads_google',    v_leads_google,
      'leads_score_ab',  v_leads_score_ab,
      'reunioes',        v_reunioes,
      'vendas',          v_vendas,
      'desqualificados', v_desqualificados
    ),
    'metas', jsonb_build_object(
      'reunioes_meta',    v_reunioes_meta,
      'vendas_meta',      v_vendas_meta,
      'prospeccoes_meta', v_prospeccoes_meta
    ),
    'prospeccao', jsonb_build_object(
      'prospeccoes_feitas', v_prospeccoes_feitas
    ),
    'conteudo', jsonb_build_object(
      'posts_feitos',      v_posts_feitos,
      'leads_isca',        v_leads_isca,
      'impressoes',        v_impressoes,
      'engajamento_medio', ROUND(v_engajamento_medio, 2)
    )
  );

  RETURN v_result;
END;
$$;

-- Permissão para usuários autenticados chamarem via client
GRANT EXECUTE ON FUNCTION public.get_dashboard_metrics(uuid, timestamptz, timestamptz) TO authenticated;
