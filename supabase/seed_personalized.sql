-- Cycling Companion - Seed Data (Mock)
-- Este script inserta datos de prueba para desarrollo
-- USER_ID: dbdb51b2-a349-422a-a5f2-ddc1b93264d5 (luis.miguel.martin@gmail.com)
--
-- NOTA: Este script es idempotente. Borra actividades y planes existentes
-- del usuario antes de insertar, así que puede ejecutarse múltiples veces
-- sin duplicar datos.

-- ==============================================================================
-- PERFIL DE USUARIO
-- ==============================================================================

INSERT INTO users (
  id, email, display_name, age, weight_kg, ftp, max_hr, rest_hr, goal
) VALUES (
  'dbdb51b2-a349-422a-a5f2-ddc1b93264d5',
  'luis.miguel.martin@gmail.com',
  'Luis Miguel',
  35, 75.0, 220, 180, 55, 'performance'
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
-- LIMPIAR DATOS EXISTENTES (idempotencia)
-- ==============================================================================

-- Borrar actividades existentes del usuario (cascade borra activity_metrics)
DELETE FROM activities WHERE user_id = 'dbdb51b2-a349-422a-a5f2-ddc1b93264d5';

-- Borrar planes semanales existentes del usuario
DELETE FROM weekly_plans WHERE user_id = 'dbdb51b2-a349-422a-a5f2-ddc1b93264d5';

-- ==============================================================================
-- ACTIVIDADES: Febrero – Marzo 2026 (31 actividades, 7 semanas)
-- FTP 220W · Peso 75kg · FC max 180 · FC reposo 55
-- Zonas: Z1 0-123W · Z2 123-165W · Z3 165-198W · Z4 198-231W · Z5 231-264W
-- Progresión ~2-3% potencia/semana
-- ==============================================================================

-- ── Semana 1: 2–8 feb ──────────────────────────────────────────────────────────

INSERT INTO activities (user_id, name, date, type, duration_seconds, distance_km, avg_power_watts, avg_hr_bpm, max_hr_bpm, avg_cadence_rpm, tss, rpe, notes) VALUES
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Endurance base — Anillo Verde', '2026-02-02', 'endurance', 5400, 45.2, 155, 130, 146, 82, 52, 4, 'Primera salida del mes. Sensaciones buenas, cadencia alta.'),
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Intervalos 4×8min Z4', '2026-02-04', 'intervals', 4200, 35.8, 215, 158, 174, 88, 78, 7, 'Intervalos en rodillo. Los dos últimos costaron pero mantuve potencia.'),
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Recuperación activa', '2026-02-05', 'recovery', 2700, 22.1, 112, 108, 124, 78, 22, 2, 'Rodaje muy suave por el barrio. Piernas pesadas del día anterior.'),
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Tempo — Puerto de Navacerrada', '2026-02-07', 'tempo', 6300, 52.4, 192, 148, 164, 80, 92, 6, 'Subida a buen ritmo. Viento en contra en la bajada.');

-- ── Semana 2: 9–15 feb ─────────────────────────────────────────────────────────

INSERT INTO activities (user_id, name, date, type, duration_seconds, distance_km, avg_power_watts, avg_hr_bpm, max_hr_bpm, avg_cadence_rpm, tss, rpe, notes) VALUES
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Endurance — Casa de Campo', '2026-02-09', 'endurance', 7200, 62.3, 158, 132, 148, 84, 68, 5, 'Salida larga por Casa de Campo. Buen ritmo constante.'),
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Intervalos 5×5min Z5', '2026-02-10', 'intervals', 3600, 30.5, 220, 162, 176, 92, 85, 8, 'VO2max. Sesión dura pero productiva. FC se disparó en los últimos intervalos.'),
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Recuperación — rodillo suave', '2026-02-11', 'recovery', 2400, 18.0, 110, 106, 120, 76, 18, 2, 'Rodillo en Z1 viendo una peli. Piernas mejor de lo esperado.'),
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Tempo progresivo — M-607', '2026-02-12', 'tempo', 5400, 48.0, 196, 150, 166, 82, 86, 6, 'Progresivo de Z3 a Z4. Últimos 20min a tope.'),
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Endurance largo — Manzanares', '2026-02-15', 'endurance', 9000, 78.5, 160, 128, 144, 83, 85, 5, 'Fondo largo de fin de semana. Nutrición en ruta bien gestionada.');

-- ── Semana 3: 16–22 feb (semana actual — 20 feb) ───────────────────────────────

INSERT INTO activities (user_id, name, date, type, duration_seconds, distance_km, avg_power_watts, avg_hr_bpm, max_hr_bpm, avg_cadence_rpm, tss, rpe, notes) VALUES
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Endurance — Dehesa de la Villa', '2026-02-16', 'endurance', 5400, 46.8, 162, 131, 147, 83, 56, 4, 'Rodaje tranquilo. Buenos watios para el esfuerzo percibido.'),
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Intervalos 6×4min Z5 + 2min Z1', '2026-02-17', 'intervals', 4500, 38.2, 225, 163, 177, 90, 90, 8, 'Sesión clave VO2max. 6 repeticiones completadas. RPE alta pero controlada.'),
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Recuperación activa — rodillo', '2026-02-18', 'recovery', 2700, 20.5, 115, 110, 125, 77, 22, 2, 'Recuperación post-intervalos. 45min suaves en Z1.'),
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Tempo — subida a Colmenar', '2026-02-19', 'tempo', 5700, 50.1, 198, 149, 165, 81, 88, 6, 'Buen tempo sostenido. Potencia estable sin picos.');

-- ── Semana 4: 23–28 feb ────────────────────────────────────────────────────────

INSERT INTO activities (user_id, name, date, type, duration_seconds, distance_km, avg_power_watts, avg_hr_bpm, max_hr_bpm, avg_cadence_rpm, tss, rpe, notes) VALUES
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Endurance — vuelta al Retiro y río', '2026-02-23', 'endurance', 5400, 47.5, 163, 132, 148, 84, 58, 4, 'Vuelta tranquila por Madrid Río y Retiro. Buen clima.'),
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Intervalos 4×10min sweet spot', '2026-02-24', 'intervals', 4800, 40.0, 200, 155, 170, 88, 82, 7, 'Sweet spot en rodillo. Intervalos largos, bien ejecutados.'),
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Recuperación — Parque Lineal', '2026-02-25', 'recovery', 2700, 21.0, 115, 109, 123, 77, 20, 2, 'Paseo por Parque Lineal. Piernas frescas para el finde.'),
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Fondo largo — Rascafría', '2026-02-28', 'endurance', 10800, 95.0, 158, 130, 152, 82, 105, 6, 'Gran fondo. 3 horas por la sierra. Subida al Puerto de Cotos incluida.');

-- ── Semana 5: 2–8 mar ──────────────────────────────────────────────────────────

INSERT INTO activities (user_id, name, date, type, duration_seconds, distance_km, avg_power_watts, avg_hr_bpm, max_hr_bpm, avg_cadence_rpm, tss, rpe, notes) VALUES
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Endurance — Anillo Verde sur', '2026-03-02', 'endurance', 5400, 48.3, 165, 133, 149, 84, 58, 4, 'Ruta sur del Anillo Verde. Tramos nuevos interesantes.'),
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Intervalos 5×6min Z4-Z5', '2026-03-03', 'intervals', 4200, 36.0, 228, 164, 178, 90, 88, 8, 'Intervalos mixtos Z4-Z5. Buena progresión respecto a febrero.'),
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Recuperación — rodillo Z1', '2026-03-04', 'recovery', 2400, 18.5, 112, 107, 121, 76, 18, 2, 'Recuperación suave post-intervalos. Sin forzar nada.'),
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Tempo — Sierra de Guadarrama', '2026-03-05', 'tempo', 6000, 53.0, 200, 150, 167, 81, 92, 6, 'Tempo por la sierra. Subidas a ritmo constante.'),
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Endurance largo — El Escorial', '2026-03-08', 'endurance', 9000, 80.0, 162, 130, 146, 83, 88, 5, 'Fondo largo hasta El Escorial. Ruta bonita, buen ritmo.');

-- ── Semana 6: 9–15 mar ─────────────────────────────────────────────────────────

INSERT INTO activities (user_id, name, date, type, duration_seconds, distance_km, avg_power_watts, avg_hr_bpm, max_hr_bpm, avg_cadence_rpm, tss, rpe, notes) VALUES
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Endurance — Casa de Campo', '2026-03-09', 'endurance', 5400, 47.0, 166, 132, 148, 84, 58, 4, 'Vuelta por Casa de Campo. Primavera empezando a notarse.'),
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Intervalos 6×5min Z5', '2026-03-10', 'intervals', 4500, 38.5, 232, 165, 178, 91, 92, 8, 'VO2max. 6 repeticiones a tope. Mejor sesión de intervalos del año.'),
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Recuperación activa', '2026-03-11', 'recovery', 2700, 20.0, 114, 108, 122, 77, 20, 2, 'Rodaje suave de recuperación. Piernas respondiendo bien.'),
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Tempo progresivo — Manzanares', '2026-03-12', 'tempo', 5400, 48.5, 204, 152, 168, 82, 90, 6, 'Tempo progresivo. Últimos 15min en Z4.'),
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Fondo — Puerto de Cotos', '2026-03-15', 'endurance', 10800, 92.0, 160, 131, 155, 82, 108, 6, 'Gran fondo por Cotos. 3 horas con buen desnivel.');

-- ── Semana 7: 16–20 mar ────────────────────────────────────────────────────────

INSERT INTO activities (user_id, name, date, type, duration_seconds, distance_km, avg_power_watts, avg_hr_bpm, max_hr_bpm, avg_cadence_rpm, tss, rpe, notes) VALUES
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Endurance — Dehesa de la Villa', '2026-03-16', 'endurance', 5400, 48.0, 168, 133, 149, 85, 60, 4, 'Rodaje aeróbico. Buenas sensaciones de inicio de semana.'),
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Intervalos 5×5min Z5 + 3min Z1', '2026-03-17', 'intervals', 4500, 38.0, 235, 166, 179, 92, 95, 8, 'Intervalos Z5. Potencia récord en el 3er intervalo.'),
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Recuperación — rodillo suave', '2026-03-18', 'recovery', 2700, 20.0, 118, 110, 124, 78, 22, 2, 'Recuperación post-intervalos. Piernas mejor de lo esperado.'),
('dbdb51b2-a349-422a-a5f2-ddc1b93264d5', 'Tempo — subida a Navacerrada', '2026-03-19', 'tempo', 6000, 52.0, 206, 153, 169, 82, 94, 7, 'Tempo exigente con 1200m de desnivel. Mejor tiempo personal en la subida.');

-- ==============================================================================
-- PLAN SEMANAL (semana actual: 16–22 feb 2026)
-- ==============================================================================

INSERT INTO weekly_plans (user_id, week_start, plan_data, ai_rationale) VALUES (
  'dbdb51b2-a349-422a-a5f2-ddc1b93264d5',
  '2026-02-16',
  '{
    "days": [
      {"day": "Lunes", "type": "endurance", "intensity": "Z2 (145-165W)", "duration": "1h 30min", "nutrition_tip": "Desayuno completo 2h antes. 1 bidón con electrolitos.", "rest_tip": "Estiramientos 10 min post-entrenamiento."},
      {"day": "Martes", "type": "intervals", "intensity": "6×4min Z5 (230-250W)", "duration": "1h 15min", "nutrition_tip": "Gel o barrita durante. Recuperador post con 30g proteína.", "rest_tip": "Dormir mínimo 8h. Evitar actividad intensa posterior."},
      {"day": "Miércoles", "type": "recovery", "intensity": "Z1 (<120W)", "duration": "45min", "nutrition_tip": "Hidratación normal. No requiere nutrición extra.", "rest_tip": "Foam roller o masaje de piernas 15 min."},
      {"day": "Jueves", "type": "tempo", "intensity": "2×25min Z3-Z4 (190-205W)", "duration": "1h 35min", "nutrition_tip": "Barrita energética a mitad. 2 bidones.", "rest_tip": "Estiramientos dinámicos. Cena rica en carbohidratos."},
      {"day": "Viernes", "type": "rest", "intensity": "Descanso total", "duration": "0 min", "nutrition_tip": "Alimentación equilibrada. Hidratación abundante.", "rest_tip": "Prioriza 8-9h de sueño. Evita pantallas antes de dormir."},
      {"day": "Sábado", "type": "endurance", "intensity": "Z2 (145-165W)", "duration": "2h 30min", "nutrition_tip": "Desayuno completo 3h antes. 1 gel cada 45min. 2-3 bidones.", "rest_tip": "Comida de recuperación en los 30min siguientes. Siesta si es posible."},
      {"day": "Domingo", "type": "recovery", "intensity": "Z1 (<115W)", "duration": "45min", "nutrition_tip": "Hidratación normal. Comida equilibrada.", "rest_tip": "Preparar la semana. Revisar plan y objetivos."}
    ]
  }',
  'Plan basado en tu carga reciente y objetivo de mejorar rendimiento. La semana incluye 2 sesiones clave (intervalos VO2max + tempo) con fondo largo el sábado. Viernes descanso total para asimilar. TSS objetivo: 310-330.'
);

-- Plan semana anterior (9-15 feb) para comparativas
INSERT INTO weekly_plans (user_id, week_start, plan_data, ai_rationale) VALUES (
  'dbdb51b2-a349-422a-a5f2-ddc1b93264d5',
  '2026-02-09',
  '{
    "days": [
      {"day": "Lunes", "type": "endurance", "intensity": "Z2 (145-165W)", "duration": "2h", "nutrition_tip": "Desayuno completo. 2 bidones.", "rest_tip": "Estiramientos 10 min."},
      {"day": "Martes", "type": "intervals", "intensity": "5×5min Z5", "duration": "1h", "nutrition_tip": "Carbohidratos previos. Recuperador post.", "rest_tip": "Dormir 8h mínimo."},
      {"day": "Miércoles", "type": "recovery", "intensity": "Z1", "duration": "40min", "nutrition_tip": "Hidratación.", "rest_tip": "Foam rolling."},
      {"day": "Jueves", "type": "tempo", "intensity": "2×20min Z3-Z4", "duration": "1h 30min", "nutrition_tip": "Gel si es necesario.", "rest_tip": "Estiramientos."},
      {"day": "Viernes", "type": "rest", "intensity": "Descanso", "duration": "0 min", "nutrition_tip": "Alimentación normal.", "rest_tip": "Descanso completo."},
      {"day": "Sábado", "type": "endurance", "intensity": "Z2 constante", "duration": "2h 30min", "nutrition_tip": "Cada 45min ingesta. Electrolitos.", "rest_tip": "Recuperación inmediata post."},
      {"day": "Domingo", "type": "recovery", "intensity": "Z1 suave", "duration": "45min", "nutrition_tip": "Desayuno completo.", "rest_tip": "Preparar semana siguiente."}
    ]
  }',
  'Semana de construcción aeróbica. 2 sesiones clave + fondo largo. Volumen moderado para consolidar base. TSS objetivo: 280-300.'
);

-- ==============================================================================
-- VERIFICACIÓN
-- ==============================================================================

SELECT COUNT(*) as total_activities FROM activities WHERE user_id = 'dbdb51b2-a349-422a-a5f2-ddc1b93264d5';

SELECT date, name, type, distance_km, avg_power_watts, tss, rpe
FROM activities
WHERE user_id = 'dbdb51b2-a349-422a-a5f2-ddc1b93264d5'
ORDER BY date DESC;

SELECT week_start, ai_rationale
FROM weekly_plans
WHERE user_id = 'dbdb51b2-a349-422a-a5f2-ddc1b93264d5'
ORDER BY week_start DESC;
