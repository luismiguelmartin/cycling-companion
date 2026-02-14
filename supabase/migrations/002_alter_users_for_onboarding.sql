-- Cycling Companion - Migración 002
-- Ajustar tabla users para el onboarding (alinear con L2 spec)
--
-- Cambios respecto a 001_initial_schema.sql:
-- 1. display_name: ahora NOT NULL (obligatorio en onboarding)
-- 2. age: ahora NOT NULL (obligatorio en onboarding)
-- 3. weight_kg: ahora NOT NULL, añadir CHECK < 300
-- 4. goal: cambiar de goal_type ENUM a TEXT con CHECK (ref: ADR-004)
-- 5. Añadir CHECK constraints más estrictos para ftp, max_hr, rest_hr

-- ==============================================================================
-- PASO 1: Eliminar columna goal con tipo ENUM y recrear como TEXT
-- ==============================================================================

ALTER TABLE public.users ALTER COLUMN goal DROP DEFAULT;

ALTER TABLE public.users
  ALTER COLUMN goal TYPE TEXT USING goal::TEXT;

ALTER TABLE public.users
  ADD CONSTRAINT users_goal_check
  CHECK (goal IN ('performance', 'health', 'weight_loss', 'recovery'));

ALTER TABLE public.users ALTER COLUMN goal SET DEFAULT 'performance';

-- ==============================================================================
-- PASO 2: Hacer campos obligatorios NOT NULL
-- ==============================================================================

ALTER TABLE public.users ALTER COLUMN display_name SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN age SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN weight_kg SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN goal SET NOT NULL;

-- ==============================================================================
-- PASO 3: Actualizar CHECK constraints
-- ==============================================================================

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_weight_kg_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_weight_kg_check
  CHECK (weight_kg > 0 AND weight_kg < 300);

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_ftp_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_ftp_check
  CHECK (ftp > 0 AND ftp < 1000);

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_max_hr_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_max_hr_check
  CHECK (max_hr > 0 AND max_hr < 250);

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_rest_hr_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_rest_hr_check
  CHECK (rest_hr > 0 AND rest_hr < 200);

-- ==============================================================================
-- COMENTARIOS
-- ==============================================================================

COMMENT ON TABLE public.users IS 'Perfil del ciclista, creado en el onboarding';
COMMENT ON COLUMN public.users.goal IS 'Objetivo: performance, health, weight_loss, recovery (TEXT con CHECK, ref ADR-004)';
