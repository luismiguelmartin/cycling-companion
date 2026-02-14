-- Cycling Companion - Initial Schema
-- Este script crea las tablas base del MVP

-- ==============================================================================
-- EXTENSIONES
-- ==============================================================================

-- Necesaria para generar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- ENUM TYPES
-- ==============================================================================

-- Tipo de objetivo del usuario
CREATE TYPE goal_type AS ENUM ('performance', 'health', 'weight_loss', 'recovery');

-- Tipo de actividad
CREATE TYPE activity_type AS ENUM ('outdoor', 'indoor', 'recovery');

-- ==============================================================================
-- TABLA: users (perfil extendido)
-- ==============================================================================
-- Nota: Supabase Auth ya crea la tabla auth.users
-- Esta tabla extiende la información del usuario con datos específicos de ciclismo

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  age INTEGER CHECK (age > 0 AND age < 120),
  weight_kg DECIMAL(5,2) CHECK (weight_kg > 0),
  ftp INTEGER CHECK (ftp > 0),  -- Functional Threshold Power
  max_hr INTEGER CHECK (max_hr > 0 AND max_hr <= 220),
  rest_hr INTEGER CHECK (rest_hr > 0 AND rest_hr <= 120),
  goal goal_type DEFAULT 'health',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para búsquedas por email
CREATE INDEX idx_users_email ON public.users(email);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- TABLA: activities
-- ==============================================================================

CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  type activity_type NOT NULL,
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0),
  distance_km DECIMAL(8,2) CHECK (distance_km >= 0),
  avg_power_watts INTEGER CHECK (avg_power_watts >= 0),
  avg_hr_bpm INTEGER CHECK (avg_hr_bpm > 0 AND avg_hr_bpm <= 220),
  max_hr_bpm INTEGER CHECK (max_hr_bpm > 0 AND max_hr_bpm <= 220),
  avg_cadence_rpm INTEGER CHECK (avg_cadence_rpm >= 0),
  tss INTEGER CHECK (tss >= 0),  -- Training Stress Score
  rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10),  -- Rating of Perceived Exertion
  ai_analysis JSONB,  -- Análisis generado por IA
  notes TEXT,
  is_reference BOOLEAN DEFAULT FALSE,  -- Actividad de referencia para comparar
  raw_file_url TEXT,  -- URL al archivo .fit/.gpx en Supabase Storage (nullable)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para optimizar consultas comunes
CREATE INDEX idx_activities_user_id ON public.activities(user_id);
CREATE INDEX idx_activities_date ON public.activities(date DESC);
CREATE INDEX idx_activities_user_date ON public.activities(user_id, date DESC);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- TABLA: weekly_plans
-- ==============================================================================

CREATE TABLE public.weekly_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,  -- Primer día de la semana (lunes)
  plan_data JSONB NOT NULL,  -- { days: [{ day, type, intensity, duration, nutrition_tip, rest_tip }] }
  ai_rationale TEXT,  -- Explicación de la IA sobre por qué generó este plan
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraint: solo un plan por semana por usuario
  UNIQUE(user_id, week_start)
);

-- Índices
CREATE INDEX idx_weekly_plans_user_id ON public.weekly_plans(user_id);
CREATE INDEX idx_weekly_plans_week_start ON public.weekly_plans(week_start DESC);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_weekly_plans_updated_at
  BEFORE UPDATE ON public.weekly_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- TABLA: activity_metrics (series temporales)
-- ==============================================================================
-- Esta tabla almacena las métricas segundo a segundo de cada actividad
-- Solo se llena cuando se importa un archivo .fit/.gpx

CREATE TABLE public.activity_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  timestamp_seconds INTEGER NOT NULL,  -- Offset en segundos desde el inicio de la actividad
  power_watts INTEGER,
  hr_bpm INTEGER CHECK (hr_bpm > 0 AND hr_bpm <= 220),
  cadence_rpm INTEGER CHECK (cadence_rpm >= 0),
  speed_kmh DECIMAL(5,2) CHECK (speed_kmh >= 0)
);

-- Índice compuesto para consultas por actividad ordenadas por tiempo
CREATE INDEX idx_activity_metrics_activity_timestamp
  ON public.activity_metrics(activity_id, timestamp_seconds);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas para la tabla users
CREATE POLICY "Los usuarios pueden ver su propio perfil"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden insertar su propio perfil"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Políticas para la tabla activities
CREATE POLICY "Los usuarios pueden ver sus propias actividades"
  ON public.activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear sus propias actividades"
  ON public.activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propias actividades"
  ON public.activities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propias actividades"
  ON public.activities FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para la tabla weekly_plans
CREATE POLICY "Los usuarios pueden ver sus propios planes"
  ON public.weekly_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear sus propios planes"
  ON public.weekly_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propios planes"
  ON public.weekly_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propios planes"
  ON public.weekly_plans FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para la tabla activity_metrics
-- Nota: El acceso se controla indirectamente a través de la relación con activities
CREATE POLICY "Los usuarios pueden ver métricas de sus actividades"
  ON public.activity_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.activities
      WHERE activities.id = activity_metrics.activity_id
      AND activities.user_id = auth.uid()
    )
  );

CREATE POLICY "Los usuarios pueden crear métricas de sus actividades"
  ON public.activity_metrics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.activities
      WHERE activities.id = activity_metrics.activity_id
      AND activities.user_id = auth.uid()
    )
  );

CREATE POLICY "Los usuarios pueden eliminar métricas de sus actividades"
  ON public.activity_metrics FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.activities
      WHERE activities.id = activity_metrics.activity_id
      AND activities.user_id = auth.uid()
    )
  );

-- ==============================================================================
-- COMENTARIOS EN LAS TABLAS (para documentación)
-- ==============================================================================

COMMENT ON TABLE public.users IS 'Perfil extendido del usuario con datos específicos de ciclismo';
COMMENT ON TABLE public.activities IS 'Actividades de ciclismo registradas por el usuario';
COMMENT ON TABLE public.weekly_plans IS 'Planes semanales generados por la IA para cada usuario';
COMMENT ON TABLE public.activity_metrics IS 'Series temporales de métricas por actividad (cuando se importa archivo .fit/.gpx)';

COMMENT ON COLUMN public.users.ftp IS 'Functional Threshold Power - potencia sostenible durante 1 hora';
COMMENT ON COLUMN public.activities.tss IS 'Training Stress Score - carga de entrenamiento calculada';
COMMENT ON COLUMN public.activities.rpe IS 'Rating of Perceived Exertion - esfuerzo percibido del 1 al 10';
COMMENT ON COLUMN public.activities.is_reference IS 'Marca actividades como referencia para comparativas';
