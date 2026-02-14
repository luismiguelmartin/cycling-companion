# Generador de Plan Semanal (Plan Generator)

> **Placeholder** — Se completará en **Fase 2-3**.

---

## Rol

Prompt de producto para la generación de planes de entrenamiento semanales personalizados. Crea un plan de 7 días adaptado al perfil, objetivos e historial del ciclista.

## Contexto de Uso

- Se invoca desde el endpoint `POST /api/v1/ai/weekly-plan`.
- Recibe perfil del usuario + historial reciente + objetivo.
- El resultado se guarda en la tabla `weekly_plans.plan_data` (JSONB).

## Output Esperado

Plan estructurado (JSONB) con:
- 7 días de entrenamiento, cada uno con:
  - Tipo de sesión (intervals, endurance, tempo, recovery, rest)
  - Duración sugerida
  - Intensidad (zonas de potencia/FC)
  - Descripción del workout
  - TSS estimado
- Resumen semanal de carga planificada
- Tips de nutrición y descanso
- Justificación del plan (`ai_rationale`)

## TODO — Fase 2-3

- [ ] Definir estructura JSONB del plan (schema Zod)
- [ ] Establecer prompt system + user con datos del ciclista
- [ ] Crear lógica de periodización (progresión de carga)
- [ ] Definir reglas de seguridad (no sobrecarga para 40+)
- [ ] Ejemplos few-shot para consistencia
- [ ] Manejar diferentes objetivos (resistencia, velocidad, pérdida peso)
- [ ] Integrar con datos de actividades pasadas para progresión
- [ ] Tests con perfiles de ejemplo

## Referencia

- Requisito funcional: `docs/02-PRD.md` §F06 (Weekly Plan)
- Modelo de datos: `docs/02-PRD.md` §3.3 (tabla `weekly_plans`)
- Tipos de entrenamiento: `prompts/CONVENTIONS.md` §10
