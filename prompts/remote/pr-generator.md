# R2 — PR Generator (Generador de PRs)

> **Placeholder** — Se completará en **Fase 3**.

---

## Rol

Agente remoto (GitHub Actions + Claude) que genera automáticamente una PR con código, tests y documentación a partir de una issue etiquetada con `ai-generate-pr`.

## Trigger

- Label `ai-generate-pr` añadido a una issue de GitHub.

## Output Esperado

- Branch creada automáticamente
- Código implementado según la issue
- Tests unitarios incluidos
- PR abierta con label `ai-generated`
- Body de la PR enlazando a la issue (`Closes #N`)

## TODO — Fase 3

- [ ] Definir el prompt completo con convenciones de código
- [ ] Configurar GitHub Action con trigger `issues.labeled`
- [ ] Definir estrategia de branching (nombre de ramas)
- [ ] Implementar generación de código con acceso al repo
- [ ] Implementar generación de tests
- [ ] Establecer límites de alcance (qué issues son elegibles)
- [ ] Mecanismo de retry si build/lint/typecheck fallan
- [ ] Tests del workflow end-to-end

## Referencia

- Rol completo: `docs/03-AGENTS-AND-DEVELOPMENT-PLAN.md` §2.2 (R2)
- Labels: `prompts/CONVENTIONS.md` §8
