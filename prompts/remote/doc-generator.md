# R5 — Doc Generator (Generador de Documentación)

> **Placeholder** — Se completará en **Fase 3**.

---

## Rol

Agente remoto (GitHub Actions + Claude) que actualiza automáticamente la documentación del proyecto cuando una PR se mergea a `main`.

## Trigger

- PR mergeada a `main`.

## Output Esperado

- Actualización automática de `CHANGELOG.md` con entrada de la PR
- Actualización de secciones relevantes del `README.md` (si aplica)
- Commit automático con los cambios de documentación

## TODO — Fase 3

- [ ] Definir el prompt completo con formato de CHANGELOG
- [ ] Configurar GitHub Action con trigger `pull_request.closed` (merged)
- [ ] Definir qué secciones del README se actualizan automáticamente
- [ ] Formato del CHANGELOG (Keep a Changelog / Conventional)
- [ ] Estrategia para PRs que no necesitan entrada en CHANGELOG
- [ ] Tests del workflow

## Referencia

- Rol completo: `docs/03-AGENTS-AND-DEVELOPMENT-PLAN.md` §2.2 (R5)
- Labels: `prompts/CONVENTIONS.md` §8
