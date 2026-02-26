-- 008: Añadir campos JSONB para distribución de zonas y best efforts
-- Fase 3 del motor de métricas avanzadas v2

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS power_zone_distribution JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS hr_zone_distribution JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS best_efforts JSONB DEFAULT NULL;

COMMENT ON COLUMN activities.power_zone_distribution IS 'Distribución de tiempo en zonas de potencia [{zone, name, seconds, percentage, color}]';
COMMENT ON COLUMN activities.hr_zone_distribution IS 'Distribución de tiempo en zonas de FC [{zone, name, seconds, percentage, color}]';
COMMENT ON COLUMN activities.best_efforts IS 'Mejores esfuerzos por ventana [{windowSeconds, label, power}]';
