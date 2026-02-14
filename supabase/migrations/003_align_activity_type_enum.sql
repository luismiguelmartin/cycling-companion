-- Cycling Companion - Migración 003
-- Alinear activity_type ENUM con el diseño del producto
--
-- Problema: El ENUM original usaba tipos por MODALIDAD (outdoor, indoor, recovery)
-- pero el diseño del producto usa tipos por TIPO DE ENTRENAMIENTO.
--
-- Cambio: ('outdoor', 'indoor', 'recovery') → ('intervals', 'endurance', 'recovery', 'tempo', 'rest')
--
-- Conversión de datos existentes:
--   outdoor  → endurance  (la mayoría de salidas exteriores son resistencia)
--   indoor   → intervals  (las sesiones indoor suelen ser intervalos)
--   recovery → recovery   (sin cambio)

-- ==============================================================================
-- PASO 1: Convertir columna de ENUM a TEXT temporalmente
-- ==============================================================================

ALTER TABLE public.activities
  ALTER COLUMN type TYPE TEXT USING type::TEXT;

-- ==============================================================================
-- PASO 2: Migrar datos existentes al nuevo esquema
-- ==============================================================================

UPDATE public.activities SET type = 'endurance' WHERE type = 'outdoor';
UPDATE public.activities SET type = 'intervals' WHERE type = 'indoor';
-- 'recovery' no cambia

-- ==============================================================================
-- PASO 3: Eliminar ENUM antiguo y crear el nuevo
-- ==============================================================================

DROP TYPE IF EXISTS activity_type;

CREATE TYPE activity_type AS ENUM ('intervals', 'endurance', 'recovery', 'tempo', 'rest');

-- ==============================================================================
-- PASO 4: Restaurar columna como ENUM
-- ==============================================================================

ALTER TABLE public.activities
  ALTER COLUMN type TYPE activity_type USING type::activity_type;
