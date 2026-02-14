-- Cycling Companion - Cleanup Mock Data
-- Este script elimina los datos de prueba insertados por seed.sql

-- ==============================================================================
-- IMPORTANTE
-- ==============================================================================
-- Reemplaza '<USER_ID>' con el UUID real de tu usuario
-- Este script SOLO elimina datos del usuario especificado (seguro)

-- ==============================================================================
-- OPCIÓN 1: Eliminar TODOS los datos del usuario
-- ==============================================================================

-- Eliminar todas las actividades (esto también elimina activity_metrics por CASCADE)
DELETE FROM activities WHERE user_id = '<USER_ID>';

-- Eliminar todos los planes semanales
DELETE FROM weekly_plans WHERE user_id = '<USER_ID>';

-- ==============================================================================
-- OPCIÓN 2: Eliminar solo datos antiguos (más conservador)
-- ==============================================================================

-- Eliminar actividades anteriores a una fecha específica
-- DELETE FROM activities
-- WHERE user_id = '<USER_ID>'
--   AND date < '2026-02-01';  -- Cambia esta fecha

-- Eliminar planes semanales antiguos
-- DELETE FROM weekly_plans
-- WHERE user_id = '<USER_ID>'
--   AND week_start < '2026-02-01';  -- Cambia esta fecha

-- ==============================================================================
-- OPCIÓN 3: Eliminar actividades marcadas como "referencia" (preservar el resto)
-- ==============================================================================

-- Eliminar solo actividades NO marcadas como referencia
-- DELETE FROM activities
-- WHERE user_id = '<USER_ID>'
--   AND is_reference = false;

-- ==============================================================================
-- VERIFICACIÓN (ejecutar ANTES de hacer DELETE)
-- ==============================================================================

-- Ver cuántas actividades se eliminarían
SELECT COUNT(*) as total_activities_to_delete
FROM activities
WHERE user_id = '<USER_ID>';

-- Ver cuántos planes se eliminarían
SELECT COUNT(*) as total_plans_to_delete
FROM weekly_plans
WHERE user_id = '<USER_ID>';

-- Ver el detalle de lo que se eliminará
SELECT date, name, type, tss, rpe
FROM activities
WHERE user_id = '<USER_ID>'
ORDER BY date DESC;

-- ==============================================================================
-- RESET COMPLETO (solo para desarrollo, TODOS los usuarios)
-- ==============================================================================

-- ⚠️ CUIDADO: Esto elimina datos de TODOS los usuarios, no solo el tuyo
-- Solo usar en entorno de desarrollo local

-- TRUNCATE TABLE activity_metrics CASCADE;
-- TRUNCATE TABLE activities CASCADE;
-- TRUNCATE TABLE weekly_plans CASCADE;

-- ==============================================================================
-- DESPUÉS DE LA LIMPIEZA
-- ==============================================================================

-- Verificar que se eliminaron correctamente
SELECT COUNT(*) as remaining_activities FROM activities WHERE user_id = '<USER_ID>';
SELECT COUNT(*) as remaining_plans FROM weekly_plans WHERE user_id = '<USER_ID>';
