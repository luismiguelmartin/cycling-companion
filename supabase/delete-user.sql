-- ==============================================================================
-- Script: Borrar usuario y todos sus datos por email
-- ==============================================================================
--
-- USO:
--   1. Abrir SQL Editor en el Dashboard de Supabase
--   2. Reemplazar 'usuario@ejemplo.com' por el email real
--   3. Ejecutar primero SOLO el bloque de verificación (paso 1)
--   4. Confirmar que es el usuario correcto
--   5. Ejecutar el DELETE (paso 2)
--   6. Ejecutar la verificación post-borrado (paso 3)
--
-- CASCADA AUTOMÁTICA:
--   auth.users → public.users → activities → activity_metrics
--                              → weekly_plans
--                              → ai_cache
--
-- ==============================================================================

-- ============================================================
-- PASO 1: Verificación pre-borrado
-- ============================================================
-- Ejecutar este SELECT primero para confirmar el usuario y sus datos.

SELECT
  au.id,
  au.email,
  au.created_at AS auth_created_at,
  pu.display_name,
  pu.age,
  pu.ftp,
  pu.goal,
  (SELECT count(*) FROM public.activities a WHERE a.user_id = au.id) AS total_activities,
  (SELECT count(*) FROM public.activity_metrics am
     JOIN public.activities a ON a.id = am.activity_id
   WHERE a.user_id = au.id) AS total_metrics,
  (SELECT count(*) FROM public.weekly_plans wp WHERE wp.user_id = au.id) AS total_plans,
  (SELECT count(*) FROM public.ai_cache ac WHERE ac.user_id = au.id) AS total_ai_cache
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE au.email = 'usuario@ejemplo.com';

-- ============================================================
-- PASO 2: Borrar usuario (CASCADE borra todo lo asociado)
-- ============================================================
-- Descomentar y ejecutar SOLO después de confirmar en el paso 1.

-- DELETE FROM auth.users WHERE email = 'usuario@ejemplo.com';

-- ============================================================
-- PASO 3: Verificación post-borrado
-- ============================================================
-- Ejecutar después del DELETE para confirmar que no queda nada.

-- SELECT count(*) AS remaining FROM auth.users WHERE email = 'usuario@ejemplo.com';

-- ============================================================
-- NOTA SOBRE STORAGE
-- ============================================================
-- Si el usuario subió archivos .fit/.gpx, estos quedan en Supabase Storage
-- (bucket "activity-files"). El CASCADE NO los borra.
-- Para limpiarlos manualmente: Dashboard > Storage > activity-files > buscar por user_id.
