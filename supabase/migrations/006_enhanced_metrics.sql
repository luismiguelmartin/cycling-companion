-- 006: Métricas avanzadas v2
-- Nuevas columnas en activities para métricas calculadas por el motor v2.
-- Todas nullable para retrocompatibilidad con actividades existentes.

ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS duration_moving INTEGER CHECK (duration_moving > 0),
  ADD COLUMN IF NOT EXISTS normalized_power INTEGER CHECK (normalized_power >= 0),
  ADD COLUMN IF NOT EXISTS max_power INTEGER CHECK (max_power >= 0),
  ADD COLUMN IF NOT EXISTS max_speed DECIMAL(6,2) CHECK (max_speed >= 0),
  ADD COLUMN IF NOT EXISTS avg_speed DECIMAL(6,2) CHECK (avg_speed >= 0),
  ADD COLUMN IF NOT EXISTS avg_power_non_zero INTEGER CHECK (avg_power_non_zero >= 0),
  ADD COLUMN IF NOT EXISTS variability_index DECIMAL(4,2),
  ADD COLUMN IF NOT EXISTS intensity_factor DECIMAL(4,2),
  ADD COLUMN IF NOT EXISTS elevation_gain INTEGER CHECK (elevation_gain >= 0),
  ADD COLUMN IF NOT EXISTS avg_hr_moving INTEGER CHECK (avg_hr_moving > 0 AND avg_hr_moving <= 220),
  ADD COLUMN IF NOT EXISTS avg_cadence_moving INTEGER CHECK (avg_cadence_moving >= 0);

-- Lat/lon/elevation en activity_metrics para recálculos futuros
ALTER TABLE public.activity_metrics
  ADD COLUMN IF NOT EXISTS lat DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS lon DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS elevation DECIMAL(7,2);

COMMENT ON COLUMN public.activities.duration_moving IS 'Duración en movimiento (segundos), excluye paradas';
COMMENT ON COLUMN public.activities.normalized_power IS 'Potencia Normalizada (W) - algoritmo Coggan';
COMMENT ON COLUMN public.activities.max_power IS 'Potencia máxima (W)';
COMMENT ON COLUMN public.activities.max_speed IS 'Velocidad máxima (km/h)';
COMMENT ON COLUMN public.activities.avg_speed IS 'Velocidad media en movimiento (km/h)';
COMMENT ON COLUMN public.activities.avg_power_non_zero IS 'Potencia media excluyendo ceros (W)';
COMMENT ON COLUMN public.activities.variability_index IS 'VI = NP / avg_power';
COMMENT ON COLUMN public.activities.intensity_factor IS 'IF = NP / FTP';
COMMENT ON COLUMN public.activities.elevation_gain IS 'Desnivel positivo acumulado (metros)';
COMMENT ON COLUMN public.activities.avg_hr_moving IS 'FC media en movimiento (bpm)';
COMMENT ON COLUMN public.activities.avg_cadence_moving IS 'Cadencia media en movimiento (rpm)';
