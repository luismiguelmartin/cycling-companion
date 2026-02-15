-- ==============================================================================
-- MIGRACIÓN 004: Tabla ai_cache para caché de respuestas IA y rate limiting
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  cache_key TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  response JSONB NOT NULL,
  model TEXT,
  prompt_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(user_id, cache_key)
);

-- Índice para rate limiting (count per user per day)
CREATE INDEX idx_ai_cache_user_created ON public.ai_cache(user_id, created_at DESC);

-- Índice para cache lookups
CREATE INDEX idx_ai_cache_user_key ON public.ai_cache(user_id, cache_key);

-- Habilitar RLS
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Los usuarios pueden ver su propio caché IA"
  ON public.ai_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden insertar en su propio caché IA"
  ON public.ai_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar su propio caché IA"
  ON public.ai_cache FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.ai_cache IS 'Caché de respuestas IA y control de rate limiting (20 llamadas/usuario/día)';
