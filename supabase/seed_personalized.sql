-- Cycling Companion - Seed Data (Mock)
-- Este script inserta datos de prueba para desarrollo
-- USER_ID: dbdb51b2-a349-422a-a5f2-ddc1b93264d5 (luis.miguel.martin@gmail.com)

-- ==============================================================================
-- PERFIL DE USUARIO
-- ==============================================================================

-- Primero, insertar el perfil extendido del usuario
INSERT INTO users (
  id,
  email,
  display_name,
  age,
  weight_kg,
  ftp,
  max_hr,
  rest_hr,
  goal
) VALUES (
  'dbdb51b2-a349-422a-a5f2-ddc1b93264d5',
  'luis.miguel.martin@gmail.com',
  'Luis Miguel',
  35,
  75.0,
  220,
  180,
  55,
  'performance'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  display_name = EXCLUDED.display_name,
  age = EXCLUDED.age,
  weight_kg = EXCLUDED.weight_kg,
  ftp = EXCLUDED.ftp,
  max_hr = EXCLUDED.max_hr,
  rest_hr = EXCLUDED.rest_hr,
  goal = EXCLUDED.goal;

-- ==============================================================================
-- ACTIVIDADES DE EJEMPLO
-- ==============================================================================

-- Actividad 1: Salida larga de fin de semana (hace 3 días)
INSERT INTO activities (
  user_id,
  name,
  date,
  type,
  duration_seconds,
  distance_km,
  avg_power_watts,
  avg_hr_bpm,
  max_hr_bpm,
  avg_cadence_rpm,
  tss,
  rpe,
  notes,
  is_reference
) VALUES (
  'dbdb51b2-a349-422a-a5f2-ddc1b93264d5',
  'Ruta del Puerto - Salida larga',
  CURRENT_DATE - INTERVAL '3 days',
  'outdoor',
  10800,  -- 3 horas
  95.5,
  195,
  148,
  172,
  88,
  180,
  8,
  'Gran salida. Me sentí muy fuerte en la subida final. Quizás fui un poco demasiado rápido al principio.',
  true  -- Marcar como actividad de referencia
);

-- Actividad 2: Sesión de intervalos indoor (hace 2 días)
INSERT INTO activities (
  user_id,
  name,
  date,
  type,
  duration_seconds,
  distance_km,
  avg_power_watts,
  avg_hr_bpm,
  max_hr_bpm,
  avg_cadence_rpm,
  tss,
  rpe,
  notes
) VALUES (
  'dbdb51b2-a349-422a-a5f2-ddc1b93264d5',
  'Intervalos 4x8min @ FTP',
  CURRENT_DATE - INTERVAL '2 days',
  'indoor',
  3600,  -- 1 hora
  0,  -- Indoor, sin distancia real
  210,
  155,
  175,
  92,
  85,
  9,
  'Duro pero completado. Los últimos 2 intervalos costaron mucho.'
);

-- Actividad 3: Recuperación activa (ayer)
INSERT INTO activities (
  user_id,
  name,
  date,
  type,
  duration_seconds,
  distance_km,
  avg_power_watts,
  avg_hr_bpm,
  max_hr_bpm,
  avg_cadence_rpm,
  tss,
  rpe,
  notes
) VALUES (
  'dbdb51b2-a349-422a-a5f2-ddc1b93264d5',
  'Recuperación - Zona 1',
  CURRENT_DATE - INTERVAL '1 day',
  'recovery',
  2700,  -- 45 minutos
  22.0,
  120,
  118,
  135,
  75,
  25,
  3,
  'Piernas cansadas del día anterior. Ritmo muy suave.'
);

-- Actividad 4: Salida matinal (hoy)
INSERT INTO activities (
  user_id,
  name,
  date,
  type,
  duration_seconds,
  distance_km,
  avg_power_watts,
  avg_hr_bpm,
  max_hr_bpm,
  avg_cadence_rpm,
  tss,
  rpe,
  notes
) VALUES (
  'dbdb51b2-a349-422a-a5f2-ddc1b93264d5',
  'Salida matinal - Tempo',
  CURRENT_DATE,
  'outdoor',
  5400,  -- 1.5 horas
  52.3,
  185,
  142,
  160,
  86,
  90,
  6,
  'Buen ritmo constante. Clima perfecto.'
);

-- Actividades adicionales de semanas anteriores (para tener historial)
-- Semana -1
INSERT INTO activities (user_id, name, date, type, duration_seconds, distance_km, avg_power_watts, avg_hr_bpm, max_hr_bpm, avg_cadence_rpm, tss, rpe) VALUES
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Salida club - Ritmo grupo', CURRENT_DATE - INTERVAL '7 days', 'outdoor', 7200, 80.0, 175, 140, 165, 84, 110, 6),
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Series cortas 10x1min', CURRENT_DATE - INTERVAL '9 days', 'indoor', 3000, 0, 230, 162, 182, 95, 65, 8),
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Rodaje suave', CURRENT_DATE - INTERVAL '10 days', 'outdoor', 4500, 48.0, 150, 130, 148, 80, 50, 4);

-- Semana -2
INSERT INTO activities (user_id, name, date, type, duration_seconds, distance_km, avg_power_watts, avg_hr_bpm, max_hr_bpm, avg_cadence_rpm, tss, rpe) VALUES
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Subida Puerto Alto - Test', CURRENT_DATE - INTERVAL '14 days', 'outdoor', 9000, 70.0, 200, 152, 170, 87, 150, 9),
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Sweet Spot 3x15min', CURRENT_DATE - INTERVAL '16 days', 'indoor', 4200, 0, 205, 150, 168, 90, 95, 7),
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Recuperación Z1', CURRENT_DATE - INTERVAL '17 days', 'recovery', 3600, 30.0, 110, 115, 130, 72, 30, 2);

-- ==============================================================================
-- PLAN SEMANAL DE EJEMPLO
-- ==============================================================================

-- Plan para la semana actual
INSERT INTO weekly_plans (
  user_id,
  week_start,
  plan_data,
  ai_rationale
) VALUES (
  'dbdb51b2-a349-422a-a5f2-ddc1b93264d5',
  DATE_TRUNC('week', CURRENT_DATE),  -- Lunes de esta semana
  '{
    "days": [
      {
        "day": "Lunes",
        "type": "recovery",
        "intensity": "Zona 1",
        "duration": "45-60 min",
        "nutrition_tip": "Hidratación constante. Evita carbohidratos simples en exceso.",
        "rest_tip": "Prioriza 8h de sueño. Considera estiramientos o yoga."
      },
      {
        "day": "Martes",
        "type": "intervals",
        "intensity": "4x8min @ FTP",
        "duration": "60 min",
        "nutrition_tip": "Carbohidratos complejos 2-3h antes. Proteína post-entreno.",
        "rest_tip": "Foam rolling en cuádriceps e isquios después de la sesión."
      },
      {
        "day": "Miércoles",
        "type": "rest",
        "intensity": "Descanso total o movilidad",
        "duration": "0-30 min",
        "nutrition_tip": "Mantén ingesta proteica. No descuides vegetales.",
        "rest_tip": "Día completo de recuperación. Escucha a tu cuerpo."
      },
      {
        "day": "Jueves",
        "type": "tempo",
        "intensity": "2x20min @ Tempo (Z3)",
        "duration": "90 min",
        "nutrition_tip": "Gel energético si superas 90min. Hidratación cada 15min.",
        "rest_tip": "Sueño de calidad. Evita pantallas 1h antes de dormir."
      },
      {
        "day": "Viernes",
        "type": "recovery",
        "intensity": "Zona 1-2, ritmo muy suave",
        "duration": "45 min",
        "nutrition_tip": "Comida ligera, rica en antioxidantes (frutas, verduras).",
        "rest_tip": "Preparación mental para la salida del fin de semana."
      },
      {
        "day": "Sábado",
        "type": "long_ride",
        "intensity": "Salida larga Z2, algunos picos Z3",
        "duration": "2.5-3h",
        "nutrition_tip": "Ingesta cada 45min (geles, barritas). Electrolitos constantes.",
        "rest_tip": "Ducha de contraste post-salida. Comida de recuperación inmediata."
      },
      {
        "day": "Domingo",
        "type": "endurance",
        "intensity": "Ritmo moderado Z2",
        "duration": "90-120 min",
        "nutrition_tip": "Desayuno completo 2h antes. Snack ligero al terminar.",
        "rest_tip": "Tarde tranquila. Preparar semana siguiente (comida, logística)."
      }
    ]
  }',
  'He diseñado este plan basándome en tu carga reciente (TSS ~450 semanal) y tu objetivo de mejorar rendimiento. La semana incluye 2 sesiones clave (intervalos + tempo) con volumen de fin de semana moderado. El miércoles es descanso completo para optimizar adaptación. Estás en una fase de construcción, evitando sobrecarga (TSS objetivo: 480-520).'
);

-- Plan de la semana pasada (para comparativas)
INSERT INTO weekly_plans (
  user_id,
  week_start,
  plan_data,
  ai_rationale
) VALUES (
  'dbdb51b2-a349-422a-a5f2-ddc1b93264d5',
  DATE_TRUNC('week', CURRENT_DATE - INTERVAL '7 days'),
  '{
    "days": [
      {"day": "Lunes", "type": "rest", "intensity": "Descanso", "duration": "0 min", "nutrition_tip": "Día de recarga.", "rest_tip": "Completo descanso."},
      {"day": "Martes", "type": "intervals", "intensity": "5x5min VO2max", "duration": "60 min", "nutrition_tip": "Carbohidratos previos.", "rest_tip": "Estiramientos."},
      {"day": "Miércoles", "type": "recovery", "intensity": "Z1", "duration": "45 min", "nutrition_tip": "Ligero.", "rest_tip": "Movilidad."},
      {"day": "Jueves", "type": "tempo", "intensity": "3x15min @ Z3", "duration": "75 min", "nutrition_tip": "Gel si es necesario.", "rest_tip": "Foam rolling."},
      {"day": "Viernes", "type": "rest", "intensity": "Descanso o Z1", "duration": "30 min", "nutrition_tip": "Hidratación.", "rest_tip": "Preparar fin de semana."},
      {"day": "Sábado", "type": "long_ride", "intensity": "Z2 con picos", "duration": "3h", "nutrition_tip": "Cada 45min ingesta.", "rest_tip": "Recuperación activa."},
      {"day": "Domingo", "type": "endurance", "intensity": "Z2 constante", "duration": "2h", "nutrition_tip": "Desayuno completo.", "rest_tip": "Descanso tarde."}
    ]
  }',
  'Plan de carga moderada-alta. TSS objetivo ~500. Enfoque en VO2max y tempo para mejorar umbrales.'
);

-- ==============================================================================
-- VERIFICACIÓN
-- ==============================================================================

-- Contar actividades insertadas por usuario
SELECT COUNT(*) as total_activities FROM activities WHERE user_id = 'dbdb51b2-a349-422a-a5f2-ddc1b93264d5';

-- Ver resumen de actividades
SELECT date, name, type, distance_km, avg_power_watts, tss, rpe
FROM activities
WHERE user_id = 'dbdb51b2-a349-422a-a5f2-ddc1b93264d5'
ORDER BY date DESC;

-- Ver planes semanales
SELECT week_start, created_at
FROM weekly_plans
WHERE user_id = 'dbdb51b2-a349-422a-a5f2-ddc1b93264d5'
ORDER BY week_start DESC;
