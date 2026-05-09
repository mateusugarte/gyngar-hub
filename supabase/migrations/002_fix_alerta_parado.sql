-- Migration 002: alerta_parado boolean → text nullable
-- Suporta 3 estados: NULL (ok) | 'amarelo' (5-9 dias parado) | 'vermelho' (10+ dias parado)

ALTER TABLE public.leads_qualified
  ALTER COLUMN alerta_parado DROP DEFAULT,
  ALTER COLUMN alerta_parado DROP NOT NULL,
  ALTER COLUMN alerta_parado TYPE text USING (
    CASE WHEN alerta_parado = true THEN 'amarelo' ELSE NULL END
  );

COMMENT ON COLUMN public.leads_qualified.alerta_parado
  IS 'NULL = ok | amarelo = parado 5-9d | vermelho = parado 10+d';
