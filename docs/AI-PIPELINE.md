# Pipeline IA de GitHub Actions

Flujo automatizado que lleva una Issue desde su creación hasta el merge de la PR, orquestado por labels y eventos de GitHub.

---

## Workflows

### R1 — Análisis IA (`ai-analyze-issue.yml`)

- **Trigger**: Label `ai-analyze` en una issue
- **Modelo**: `claude-haiku-4-5`
- **Permisos**: Solo lectura (`Read`, `Glob`, `Grep`)
- **Acción**: Comenta en la issue con complejidad, archivos afectados, approach y estimación
- **Timeout**: 5 min / 8 turnos

### R2 — Generación de PR (`ai-generate-pr.yml`)

- **Trigger**: Label `ai-generate-pr` en una issue
- **Modelo**: `claude-sonnet-4-6`
- **Permisos**: Lectura y escritura (`Edit`, `Write`, `Bash`)
- **Acción**:
  1. Instala dependencias (`pnpm install --frozen-lockfile`)
  2. Implementa el cambio según la issue
  3. Valida con `pnpm lint`, `pnpm typecheck`, `pnpm test`
  4. Crea rama `ai/issue-{N}-slug` y abre PR con `Closes #{N}` y label `ai-generated`
- **Timeout**: 15 min / 25 turnos

### R3 — Review IA (`ai-review-pr.yml`)

- **Trigger automático**: PR abierta o actualizada (excepto Dependabot)
- **Modelo**: `claude-haiku-4-5`
- **Permisos**: Solo lectura
- **Acción**: Comenta resumen, calidad y veredicto (informativo, nunca bloquea merge). Añade label `ai-reviewed`
- **Nota**: `allowed_bots: "claude"` permite revisar PRs generadas por R2
- **Timeout**: 5 min / 8 turnos

### Claude Interactive (`ai-claude-interactive.yml`)

- **Trigger**: Comentario con `@claude` en cualquier issue o PR
- **Modelo**: `claude-sonnet-4-6`
- **Permisos**: Lectura, escritura y ejecución (`Edit`, `Write`, `Bash(git/pnpm/gh)`)
- **Acción**: Responde preguntas, sugiere código, ejecuta tests o hace cambios con commit si se le pide
- **Timeout**: 10 min / 10 turnos

### R5 — Changelog automático (`ai-update-changelog.yml`)

- **Trigger automático**: PR mergeada a `main`
- **Modelo**: `claude-haiku-4-5`
- **Acción**: Añade entrada en `CHANGELOG.md` bajo la categoría correcta en `[Sin versionar]` y pushea a main
- **Timeout**: 5 min / 8 turnos

### CI Backend (`ci-backend.yml`)

- **Trigger**: Push a `main` o PR que toque `apps/api/**`, `packages/shared/**`
- **Pipeline**: lint → typecheck → format:check → test → build

### CI Frontend (`ci-frontend.yml`)

- **Trigger**: Push a `main` o PR que toque `apps/web/**`, `packages/shared/**`
- **Pipeline**: lint → typecheck → format:check → test → build

### Sync Labels (`ai-label-sync.yml`)

- **Trigger**: Push a `main` que modifique `.github/labels.yml`, o ejecución manual
- **Acción**: Sincroniza las labels del repositorio con el fichero de configuración

---

## Flujo típico

```
Issue creada
  │
  ├─ Label `ai-analyze` ──→ R1 comenta análisis
  │
  ├─ Label `ai-generate-pr` ──→ R2 implementa + abre PR
  │                                  │
  │                                  ├─ R3 review automático
  │                                  ├─ CI valida (lint/types/tests/build)
  │                                  │
  │                                  └─ Revisión humana → Merge
  │                                                         │
  │                                                         └─ R5 actualiza CHANGELOG
  │
  └─ `@claude` en comentario ──→ Claude Interactive responde/actúa
```

---

## Labels del pipeline

| Label | Tipo | Descripción |
|-------|------|-------------|
| `ai-analyze` | Trigger | Dispara R1 (análisis) |
| `ai-generate-pr` | Trigger | Dispara R2 (generación de PR) |
| `ai-generated` | Informativa | PR creada por IA |
| `ai-reviewed` | Informativa | PR revisada por IA |
