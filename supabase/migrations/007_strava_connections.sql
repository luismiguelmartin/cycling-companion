-- Tabla de conexiones Strava (OAuth tokens + metadata)
CREATE TABLE public.strava_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  strava_athlete_id BIGINT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT NOT NULL DEFAULT 'activity:read_all',
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraints de unicidad
ALTER TABLE public.strava_connections
  ADD CONSTRAINT strava_connections_user_id_unique UNIQUE (user_id);
ALTER TABLE public.strava_connections
  ADD CONSTRAINT strava_connections_athlete_id_unique UNIQUE (strava_athlete_id);

-- Índice para búsqueda por strava_athlete_id (webhooks)
CREATE INDEX idx_strava_connections_athlete_id
  ON public.strava_connections (strava_athlete_id);

-- Trigger updated_at (reutiliza función existente de migración 001)
CREATE TRIGGER set_strava_connections_updated_at
  BEFORE UPDATE ON public.strava_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.strava_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own strava connection"
  ON public.strava_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strava connection"
  ON public.strava_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strava connection"
  ON public.strava_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own strava connection"
  ON public.strava_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Añadir campos a activities para tracking de origen
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS strava_id BIGINT,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';

-- Índice parcial único en strava_id (permite NULL pero evita duplicados con valor)
CREATE UNIQUE INDEX idx_activities_strava_id
  ON public.activities (strava_id)
  WHERE strava_id IS NOT NULL;

-- Check constraint para source
ALTER TABLE public.activities
  ADD CONSTRAINT activities_source_check
  CHECK (source IN ('manual', 'upload', 'strava'));
