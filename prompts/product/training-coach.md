# Entrenador IA (Training Coach)

> **Placeholder** — Se completará en **Fase 2-3**.

---

## Rol

Prompt de producto para el entrenador virtual de IA que genera recomendaciones personalizadas para ciclistas basándose en su perfil, historial de actividades y objetivos.

## Contexto de Uso

- Se invoca desde el endpoint `POST /api/v1/ai/weekly-summary` (entre otros).
- Recibe datos del usuario y produce texto de coaching.
- Es el prompt que define la "personalidad" del coach en la app.

## Output Esperado

Texto en español con:

- Recomendación principal del día/semana
- Tips de entrenamiento adaptados al nivel
- Alertas de sobrecarga si aplica
- Tono motivacional pero realista (dirigido a ciclistas 40+)

## TODO — Fase 2-3

- [ ] Definir personalidad y tono del coach
- [ ] Establecer estructura del prompt (system + user)
- [ ] Definir datos de contexto que recibe (perfil, métricas, historial)
- [ ] Crear ejemplos few-shot para consistencia
- [ ] Definir límites de tokens y temperatura
- [ ] Manejar edge cases (usuario nuevo sin datos, datos insuficientes)
- [ ] Tests de calidad de respuestas

## Referencia

- Requisito funcional: `docs/02-PRD.md` §F10 (AI Coach)
- Alertas: `docs/02-PRD.md` §F09 (Overload Alerts)
