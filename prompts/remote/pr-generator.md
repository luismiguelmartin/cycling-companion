# R2 — PR Generator (Generador de PRs)

> **Estado**: ✅ Implementado — Fase 4

---

## Rol

Agente remoto (GitHub Actions + Claude Code) que genera automáticamente una PR con código, tests y documentación a partir de una issue etiquetada con `ai-generate-pr`.

## Configuración

| Campo            | Valor                                                      |
| ---------------- | ---------------------------------------------------------- |
| **Workflow**     | `.github/workflows/ai-generate-pr.yml`                     |
| **Trigger**      | `issues.labeled` → label `ai-generate-pr`                  |
| **Modelo**       | `claude-sonnet-4-5-20250929`                               |
| **Max turns**    | 15                                                         |
| **Timeout**      | 15 minutos                                                 |
| **Permisos**     | `contents: write`, `pull-requests: write`, `issues: write` |
| **Setup previo** | pnpm install + Node 22 (antes de Claude)                   |

## Prompt

El agente recibe la issue completa y acceso al repositorio con dependencias pre-instaladas.

### Instrucciones

1. **Analizar la issue**: Leer título, descripción, labels y cualquier análisis previo de R1.
2. **Planificar**: Identificar archivos a crear/modificar siguiendo convenciones del proyecto.
3. **Implementar**: Escribir código siguiendo las convenciones de `CLAUDE.md`.
4. **Validar**: Ejecutar `pnpm lint`, `pnpm typecheck`, `pnpm test`. Corregir errores.
5. **Crear PR**: Branch + commit + PR con formato estructurado.

### Convenciones de Código

- TypeScript estricto (`strict: true`, no `any`)
- Schemas Zod en `packages/shared` para validación compartida
- Tests con Vitest (co-localizados: `file.ts` + `file.test.ts`)
- Componentes React: PascalCase, archivos kebab-case
- API Fastify: schema Zod por route, error handler consistente
- Commits en español: `feat:`, `fix:`, `refactor:`, `docs:`

### Naming de Branch

`ai/issue-{number}-{slug}` donde slug es una versión kebab-case del título.

Ejemplo: Issue #42 "Añadir campo clima" → `ai/issue-42-add-weather-field`

### Formato de la PR

```
## Descripción
[Resumen conciso de los cambios]

## Issue relacionada
Closes #N

## Cambios realizados
- [Cambio 1]
- [Cambio 2]

## Tests
- [Test añadido 1]
- [Test añadido 2]

## Validación
- [x] `pnpm lint` ✅
- [x] `pnpm typecheck` ✅
- [x] `pnpm test` ✅

---
> 🤖 PR generada por R2 (PR Generator) — `claude-sonnet-4-5-20250929`
```

### Reglas

- NUNCA modificar archivos fuera del scope de la issue
- No sobre-ingeniería: implementar solo lo necesario
- Si la issue es demasiado compleja o ambigua → comentar en la issue explicando por qué
- Añadir label `ai-generated` a la PR
- Branch prefix: `ai/`
- La IA NUNCA mergea. Solo propone.

## Herramientas Disponibles

- Lectura y escritura de archivos
- Ejecución de comandos (lint, test, typecheck, build)
- Creación de branches y PRs via git/gh
- Búsqueda en el codebase

## Ejemplo de Uso

1. Issue #42: "Añadir campo clima a la actividad"
2. Usuario añade label `ai-generate-pr`
3. R2 lee issue + análisis de R1
4. R2 crea branch `ai/issue-42-add-weather-field`
5. R2 implementa: migración SQL, schema Zod, endpoint API, componente React, tests
6. R2 ejecuta lint/typecheck/test → todo pasa
7. R2 abre PR con `Closes #42` y label `ai-generated`
