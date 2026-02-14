# R1 — Issue Analyzer (Analizador de Issues)

> **Placeholder** — Se completará en **Fase 2**.

---

## Rol

Agente remoto (GitHub Actions + Claude) que analiza issues etiquetadas con `ai-analyze` para evaluar impacto, riesgos y complejidad.

## Trigger

- Label `ai-analyze` añadido a una issue de GitHub.

## Output Esperado

Comentario en la issue con:
- Análisis de complejidad (baja/media/alta)
- Archivos potencialmente afectados
- Riesgos identificados
- Sugerencia de approach
- Estimación de esfuerzo

## TODO — Fase 2

- [ ] Definir el prompt completo con contexto del proyecto
- [ ] Configurar GitHub Action con trigger `issues.labeled`
- [ ] Definir formato del comentario de respuesta
- [ ] Establecer límites de tokens y modelo a usar
- [ ] Implementar acceso al código fuente del repo desde la Action
- [ ] Tests del workflow con issues de ejemplo

## Referencia

- Rol completo: `docs/03-AGENTS-AND-DEVELOPMENT-PLAN.md` §2.2 (R1)
- Labels: `prompts/CONVENTIONS.md` §8
