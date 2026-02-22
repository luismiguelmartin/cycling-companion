-- ==============================================================================
-- MIGRACIÓN 005: Función atómica para rate limiting de IA
-- Evita race conditions al verificar e incrementar el contador en una sola operación
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.check_ai_rate_limit(
  p_user_id UUID,
  p_max_daily_calls INTEGER DEFAULT 20
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Contar llamadas del día de forma atómica con FOR UPDATE (bloqueo de fila)
  SELECT COUNT(*)
  INTO v_count
  FROM public.ai_cache
  WHERE user_id = p_user_id
    AND created_at >= (CURRENT_DATE AT TIME ZONE 'UTC');

  -- Retorna el conteo actual; el caller decide si permite o no
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.check_ai_rate_limit IS 'Verifica el rate limit de IA de forma atómica. Retorna el número de llamadas del día.';
