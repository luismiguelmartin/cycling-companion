# R3 — PR Reviewer (Revisor de PRs)

> **Placeholder** — Se completará en **Fase 2**.

---

## Rol

Agente remoto (GitHub Actions + Claude) que revisa automáticamente las PRs abiertas o actualizadas, evaluando estilo, complejidad, seguridad y cobertura de tests.

## Trigger

- PR abierta o sincronizada (push a branch existente).

## Output Esperado

Comentario de review en la PR con:

- Resumen de cambios
- Verificación de convenciones de código
- Detección de problemas de seguridad (RLS, secrets, inyección)
- Sugerencias de mejora
- Aprobación o solicitud de cambios

## TODO — Fase 2

- [ ] Definir el prompt completo con criterios de review
- [ ] Configurar GitHub Action con trigger `pull_request.opened` y `pull_request.synchronize`
- [ ] Definir criterios de aprobación automática vs manual
- [ ] Establecer umbral de severidad para bloquear merge
- [ ] Implementar acceso al diff de la PR
- [ ] Formato del comentario (inline vs general)
- [ ] Tests del workflow con PRs de ejemplo

## Referencia

- Rol completo: `docs/03-AGENTS-AND-DEVELOPMENT-PLAN.md` §2.2 (R3)
- Labels: `prompts/CONVENTIONS.md` §8
