# Analizador de Actividades (Activity Analyzer)

> **Placeholder** — Se completará en **Fase 2-3**.

---

## Rol

Prompt de producto para el análisis post-sesión de actividades de ciclismo. Genera un análisis inteligente de cada actividad basándose en las métricas registradas y el contexto del plan de entrenamiento.

## Contexto de Uso

- Se invoca desde el endpoint `POST /api/v1/ai/analyze-activity`.
- Recibe métricas de la actividad + perfil del usuario.
- El resultado se guarda en el campo `ai_analysis` (JSONB) de la tabla `activities`.

## Output Esperado

Análisis estructurado (JSONB) con:
- Resumen de la sesión
- Evaluación del esfuerzo vs objetivo planificado
- Puntos fuertes y áreas de mejora
- Comparación con actividades similares previas
- Recomendación para la próxima sesión

## TODO — Fase 2-3

- [ ] Definir estructura del JSONB de salida
- [ ] Establecer prompt system + user con datos de actividad
- [ ] Crear lógica de comparación con historial
- [ ] Definir umbrales para evaluaciones (bueno/regular/mejorable)
- [ ] Ejemplos few-shot para consistencia de formato
- [ ] Manejar diferentes tipos de actividad (intervals, endurance, etc.)
- [ ] Tests con datos reales de ejemplo

## Referencia

- Requisito funcional: `docs/02-PRD.md` §F05 (Activity Detail — AI Analysis)
- Modelo de datos: `docs/02-PRD.md` §3.3 (tabla `activities.ai_analysis`)
