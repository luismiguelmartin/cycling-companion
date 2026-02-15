# L2 — Fase 4: Agentes Remotos (Diseno Tecnico)

> **Tipo**: Especificacion tecnica (L2)
> **Fase**: 4 — Agentes Remotos
> **Estado**: Pendiente
> **Fecha**: 2026-02-15

---

## 1. Resumen

Fase 4 implementa un pipeline de **agentes remotos** basado en `anthropic/claude-code-action@v1` ejecutado en GitHub Actions. El objetivo es automatizar tareas repetitivas del ciclo de desarrollo: analisis de issues, generacion de PRs, code review, actualizacion de CHANGELOG e interaccion conversacional via `@claude`.

**Componentes**:
- **5 workflows** de GitHub Actions (`.github/workflows/`)
- **4 archivos de prompt** (`prompts/remote/`)
- **16 labels** organizadas en 4 categorias
- **CHANGELOG.md** generado automaticamente tras cada merge

**Modelo**: Todos los agentes usan `claude-sonnet-4-5-20250929` para balance coste/velocidad.

**Principio**: Los agentes remotos ejecutan y verifican; el humano siempre supervisa y valida. Ningun agente bloquea el merge de una PR.

---

## 2. Arquitectura

### 2.1 Flujo General

```
┌─────────────────────────────────────────────────────────────┐
│                     GITHUB EVENTS                            │
│                                                              │
│  issues.labeled    pull_request.opened    pull_request.closed│
│  issue_comment     pull_request.synchronize                  │
└──────────┬──────────────────┬──────────────────┬────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   GITHUB ACTIONS WORKFLOWS                   │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ ai-analyze-  │  │ ai-generate- │  │ ai-review-pr.yml │  │
│  │ issue.yml    │  │ pr.yml       │  │                  │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                 │                    │             │
│  ┌──────────────────┐  ┌──────────────────────────┐         │
│  │ ai-update-       │  │ ai-claude-interactive.yml │         │
│  │ changelog.yml    │  │                          │         │
│  └──────┬───────────┘  └────────────┬─────────────┘         │
└─────────┼───────────────────────────┼───────────────────────┘
          │                           │
          ▼                           ▼
┌─────────────────────────────────────────────────────────────┐
│              claude-code-action@v1                            │
│                                                              │
│  - Lee repositorio completo (CLAUDE.md, codigo, specs)      │
│  - Modelo: claude-sonnet-4-5-20250929                       │
│  - Prompts en prompts/remote/*.md                           │
│  - Herramientas: bash, file read/write, git, gh CLI         │
└──────────┬──────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│                    GITHUB API (Output)                        │
│                                                              │
│  - Comentarios en issues/PRs (sticky comments)              │
│  - Creacion de ramas y PRs                                  │
│  - Commits directos (CHANGELOG)                             │
│  - Labels (ai-generated, ai-reviewed)                       │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Estructura de Archivos

```
cycling-companion/
├── .github/
│   └── workflows/
│       ├── ai-analyze-issue.yml        # R1 — Issue Analyzer
│       ├── ai-generate-pr.yml          # R2 — PR Generator
│       ├── ai-review-pr.yml            # R3 — PR Reviewer
│       ├── ai-update-changelog.yml     # R5 — Doc Generator
│       └── ai-claude-interactive.yml   # @claude Interactivo
├── prompts/
│   └── remote/
│       ├── issue-analyzer.md           # Prompt R1
│       ├── pr-generator.md             # Prompt R2
│       ├── pr-reviewer.md              # Prompt R3
│       └── doc-generator.md            # Prompt R5
└── CHANGELOG.md                        # Generado/actualizado por R5
```

### 2.3 Configuracion Comun de Workflows

Todos los workflows comparten:
- **Action**: `anthropic/claude-code-action@v1`
- **Modelo**: `claude-sonnet-4-5-20250929`
- **Checkout**: `actions/checkout@v4`
- **Node**: `actions/setup-node@v4` con Node 22
- **pnpm**: `pnpm/action-setup@v4`
- **Secret**: `ANTHROPIC_API_KEY` (repository secret)

---

## 3. Agentes Remotos — Detalle

### 3.1 R1 — Issue Analyzer

**Proposito**: Analizar issues etiquetadas con `ai-analyze` y publicar un comentario con plan de implementacion.

| Campo | Valor |
|-------|-------|
| **Trigger** | `issues.labeled` → label `ai-analyze` |
| **Workflow** | `.github/workflows/ai-analyze-issue.yml` |
| **Modelo** | `claude-sonnet-4-5-20250929` |
| **Max turns** | 3 |
| **Timeout** | 5 minutos |
| **Prompt** | `prompts/remote/issue-analyzer.md` |

**Permisos**:
```yaml
permissions:
  contents: read
  issues: write
```

**Output**: Comentario sticky en la issue con:
- Complejidad estimada (baja / media / alta)
- Archivos afectados (rutas concretas)
- Riesgos identificados
- Tests necesarios
- Enfoque de implementacion propuesto
- Estimacion de tiempo (horas)

**Prompt** (`prompts/remote/issue-analyzer.md`):
```markdown
Eres un analista tecnico del proyecto Cycling Companion.

Analiza la issue y genera un comentario estructurado con:
1. **Complejidad**: baja / media / alta
2. **Archivos afectados**: lista de rutas concretas en el repo
3. **Riesgos**: posibles problemas o dependencias
4. **Tests**: que tests se necesitan (unitarios, integracion, e2e)
5. **Enfoque**: pasos concretos de implementacion
6. **Estimacion**: horas estimadas

Usa el contexto del repositorio (CLAUDE.md, codigo existente, specs).
Responde en espanol. Formato Markdown.
```

**Workflow simplificado**:
```yaml
name: AI - Analyze Issue
on:
  issues:
    types: [labeled]

jobs:
  analyze:
    if: github.event.label.name == 'ai-analyze'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      issues: write
    steps:
      - uses: actions/checkout@v4
      - uses: anthropic/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          model: claude-sonnet-4-5-20250929
          max_turns: 3
          timeout_minutes: 5
          prompt_file: prompts/remote/issue-analyzer.md
```

---

### 3.2 R2 — PR Generator

**Proposito**: Generar una PR completa con codigo funcional a partir de una issue etiquetada con `ai-generate-pr`.

| Campo | Valor |
|-------|-------|
| **Trigger** | `issues.labeled` → label `ai-generate-pr` |
| **Workflow** | `.github/workflows/ai-generate-pr.yml` |
| **Modelo** | `claude-sonnet-4-5-20250929` |
| **Max turns** | 15 |
| **Timeout** | 15 minutos |
| **Prompt** | `prompts/remote/pr-generator.md` |

**Permisos**:
```yaml
permissions:
  contents: write
  pull-requests: write
  issues: write
```

**Setup previo a Claude** (ahorra turnos/tokens):
```yaml
steps:
  - uses: actions/checkout@v4
  - uses: pnpm/action-setup@v4
  - uses: actions/setup-node@v4
    with:
      node-version: 22
      cache: pnpm
  - run: pnpm install
  - uses: anthropic/claude-code-action@v1
    with:
      # ...
```

**Convencion de ramas**: `ai/issue-{number}-{slug}`
- Ejemplo: `ai/issue-42-add-weather-widget`
- El slug se genera a partir del titulo de la issue (kebab-case, max 40 chars)

**Output**:
- Rama nueva con commits de codigo
- PR abierta con label `ai-generated`
- Descripcion de PR con `Closes #{issue_number}`
- Comentario en la issue original con link a la PR

**Control de concurrencia**:
```yaml
concurrency:
  group: ai-generate-pr-${{ github.event.issue.number }}
  cancel-in-progress: true
```

**Prompt** (`prompts/remote/pr-generator.md`):
```markdown
Eres un desarrollador senior del proyecto Cycling Companion.

Tu tarea es implementar la issue #{issue_number} creando una PR completa.

Pasos:
1. Lee la issue completa y el analisis de R1 si existe
2. Lee CLAUDE.md para entender convenciones del proyecto
3. Crea una rama: ai/issue-{number}-{slug}
4. Implementa los cambios siguiendo las convenciones
5. Ejecuta: pnpm typecheck, pnpm lint, pnpm test
6. Corrige errores si los hay
7. Crea la PR con: titulo descriptivo, descripcion con Closes #{number}
8. Anade label ai-generated a la PR

Convenciones:
- TypeScript estricto, no any
- Tests para logica nueva
- Commits en espanol (feat:, fix:, refactor:)
- PR pequena y enfocada
```

---

### 3.3 R3 — PR Reviewer

**Proposito**: Revisar automaticamente cada PR abierta o actualizada y publicar un comentario informativo con analisis de calidad.

| Campo | Valor |
|-------|-------|
| **Trigger** | `pull_request.opened` / `pull_request.synchronize` |
| **Workflow** | `.github/workflows/ai-review-pr.yml` |
| **Modelo** | `claude-sonnet-4-5-20250929` |
| **Max turns** | 3 |
| **Timeout** | 5 minutos |
| **Prompt** | `prompts/remote/pr-reviewer.md` |

**Permisos**:
```yaml
permissions:
  contents: read
  pull-requests: write
```

**Exclusiones** (evitar loops con bots):
```yaml
jobs:
  review:
    if: >
      github.actor != 'dependabot[bot]' &&
      github.actor != 'github-actions[bot]'
    runs-on: ubuntu-latest
```

**Output**: Comentario sticky en la PR con:
- Resumen de cambios (1-2 frases)
- Calidad del codigo (estructura, naming, tipos)
- Seguridad (secrets expuestos, inputs sin validar, RLS)
- Tests (cobertura, casos edge)
- Sugerencias de mejora (max 5, priorizadas)
- Veredicto: Aprobado / Aprobado con sugerencias / Requiere cambios

**IMPORTANTE**: R3 es **solo informativo**. Nunca bloquea el merge. La decision final siempre es del desarrollador humano.

**Label**: Anade `ai-reviewed` a la PR tras publicar el comentario.

**Prompt** (`prompts/remote/pr-reviewer.md`):
```markdown
Eres un reviewer senior del proyecto Cycling Companion.

Revisa esta PR y genera un comentario estructurado:

1. **Resumen**: que hace esta PR (1-2 frases)
2. **Calidad**: estructura, naming, tipos TypeScript, adherencia a CLAUDE.md
3. **Seguridad**: secrets, validacion de inputs, RLS, inyeccion SQL
4. **Tests**: cobertura adecuada, casos edge cubiertos
5. **Sugerencias**: maximo 5, priorizadas por impacto
6. **Veredicto**: Aprobado / Aprobado con sugerencias / Requiere cambios

IMPORTANTE: Tu review es INFORMATIVA. No bloquees el merge.
Responde en espanol. Formato Markdown.
Anade el label ai-reviewed a la PR.
```

---

### 3.4 R5 — Doc Generator (CHANGELOG)

**Proposito**: Actualizar `CHANGELOG.md` automaticamente cuando una PR se mergea a `main`.

| Campo | Valor |
|-------|-------|
| **Trigger** | `pull_request.closed` (con `merged == true`) |
| **Workflow** | `.github/workflows/ai-update-changelog.yml` |
| **Modelo** | `claude-sonnet-4-5-20250929` |
| **Max turns** | 5 |
| **Timeout** | 5 minutos |
| **Prompt** | `prompts/remote/doc-generator.md` |

**Permisos**:
```yaml
permissions:
  contents: write
```

**Checkout post-merge**:
```yaml
steps:
  - uses: actions/checkout@v4
    with:
      ref: main  # Importante: checkout de main post-merge
```

**Output**:
- `CHANGELOG.md` actualizado con la entrada de la PR mergeada
- Commit automatico con mensaje `docs: actualizar CHANGELOG (PR #{number})`
- Push directo a `main`

**Formato CHANGELOG** (Keep a Changelog en espanol):
```markdown
# Changelog

Todos los cambios notables en este proyecto seran documentados en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/).

## [2026-02-15]

### Anadido
- Endpoint de upload de archivos GPX con soporte Garmin extensions (#45)

### Cambiado
- Migrar pantalla de perfil de Supabase directo a API backend (#52)

### Corregido
- Importacion GPX: HR/cadencia, NP, moving time, eje X km (#55)

### Eliminado
- Dependencia directa de Supabase en componentes del dashboard (#50)
```

**Categorias**: `Anadido`, `Cambiado`, `Corregido`, `Eliminado`

**Agrupacion**: Por fecha (formato `YYYY-MM-DD`), sin versionado semantico por ahora.

**Prompt** (`prompts/remote/doc-generator.md`):
```markdown
Eres el documentador del proyecto Cycling Companion.

Tu tarea: actualizar CHANGELOG.md con los cambios de la PR recien mergeada.

Reglas:
1. Lee el diff de la PR y su descripcion
2. Clasifica los cambios en: Anadido / Cambiado / Corregido / Eliminado
3. Anade una entrada bajo la fecha de hoy (formato YYYY-MM-DD)
4. Si ya existe una seccion para hoy, anade los items a las categorias existentes
5. Si no existe CHANGELOG.md, crealo con el header estandar
6. Escribe en espanol
7. Referencia el numero de PR: (#N)
8. Haz commit y push a main

Formato: Keep a Changelog (https://keepachangelog.com/es/1.1.0/)
```

---

### 3.5 @claude Interactivo

**Proposito**: Permitir interaccion libre con Claude mencionando `@claude` en comentarios de issues o PRs.

| Campo | Valor |
|-------|-------|
| **Trigger** | `issue_comment.created` conteniendo `@claude` |
| **Workflow** | `.github/workflows/ai-claude-interactive.yml` |
| **Modelo** | `claude-sonnet-4-5-20250929` |
| **Max turns** | 5 |
| **Timeout** | 10 minutos |

**Permisos**:
```yaml
permissions:
  contents: write
  pull-requests: write
  issues: write
```

**Setup**: Incluye `pnpm install` porque Claude puede necesitar ejecutar tests o builds.

**Flexible por diseno**: No tiene restricciones de herramientas. Claude puede:
- Leer y modificar codigo
- Ejecutar tests y lints
- Crear commits y PRs
- Responder preguntas sobre el codebase

**Workflow**:
```yaml
name: AI - Claude Interactive
on:
  issue_comment:
    types: [created]

jobs:
  respond:
    if: contains(github.event.comment.body, '@claude')
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install
      - uses: anthropic/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          model: claude-sonnet-4-5-20250929
          max_turns: 5
          timeout_minutes: 10
```

---

## 4. Sistema de Labels

16 labels organizadas en 4 categorias. Se crean manualmente en GitHub o via script.

### 4.1 AI Pipeline (4 labels)

| Label | Color | Descripcion |
|-------|-------|-------------|
| `ai-analyze` | `#1d76db` | Trigger: analisis automatico de issue por R1 |
| `ai-generate-pr` | `#0e8a16` | Trigger: generacion automatica de PR por R2 |
| `ai-generated` | `#e99695` | Marca: PR fue generada por un agente IA |
| `ai-reviewed` | `#bfd4f2` | Marca: PR fue revisada por agente IA R3 |

### 4.2 Type (5 labels)

| Label | Color | Descripcion |
|-------|-------|-------------|
| `type:feature` | `#a2eeef` | Nueva funcionalidad |
| `type:bug` | `#d73a4a` | Correccion de error |
| `type:refactor` | `#d4c5f9` | Mejora de codigo sin cambio funcional |
| `type:docs` | `#0075ca` | Documentacion |
| `type:test` | `#fbca04` | Tests nuevos o mejorados |

### 4.3 Priority (3 labels)

| Label | Color | Descripcion |
|-------|-------|-------------|
| `priority:p0` | `#b60205` | Critica — resolver inmediatamente |
| `priority:p1` | `#d93f0b` | Alta — resolver en el sprint actual |
| `priority:p2` | `#fbca04` | Normal — backlog priorizado |

### 4.4 Phase (4 labels)

| Label | Color | Descripcion |
|-------|-------|-------------|
| `phase:1` | `#c5def5` | Fase 1: Setup inicial |
| `phase:2` | `#bfdadc` | Fase 2: Frontend |
| `phase:3` | `#d4c5f9` | Fase 3: Backend + IA |
| `phase:4` | `#f9d0c4` | Fase 4: Agentes remotos |

### 4.5 Script de Creacion

```bash
#!/bin/bash
# Crear labels via gh CLI
gh label create "ai-analyze" --color "1d76db" --description "Trigger: analisis automatico de issue"
gh label create "ai-generate-pr" --color "0e8a16" --description "Trigger: generacion automatica de PR"
gh label create "ai-generated" --color "e99695" --description "PR generada por agente IA"
gh label create "ai-reviewed" --color "bfd4f2" --description "PR revisada por agente IA"
gh label create "type:feature" --color "a2eeef" --description "Nueva funcionalidad"
gh label create "type:bug" --color "d73a4a" --description "Correccion de error"
gh label create "type:refactor" --color "d4c5f9" --description "Mejora de codigo sin cambio funcional"
gh label create "type:docs" --color "0075ca" --description "Documentacion"
gh label create "type:test" --color "fbca04" --description "Tests nuevos o mejorados"
gh label create "priority:p0" --color "b60205" --description "Critica"
gh label create "priority:p1" --color "d93f0b" --description "Alta"
gh label create "priority:p2" --color "fbca04" --description "Normal"
gh label create "phase:1" --color "c5def5" --description "Fase 1: Setup"
gh label create "phase:2" --color "bfdadc" --description "Fase 2: Frontend"
gh label create "phase:3" --color "d4c5f9" --description "Fase 3: Backend + IA"
gh label create "phase:4" --color "f9d0c4" --description "Fase 4: Agentes remotos"
```

---

## 5. Infraestructura

### 5.1 Secretos de GitHub

| Secreto | Tipo | Uso |
|---------|------|-----|
| `ANTHROPIC_API_KEY` | Repository secret | Autenticacion con Claude API via claude-code-action |

**Nota**: `GITHUB_TOKEN` se proporciona automaticamente por GitHub Actions con los permisos definidos en el workflow. No requiere configuracion manual.

### 5.2 Dependencias de Actions

| Action | Version | Proposito |
|--------|---------|-----------|
| `actions/checkout` | `v4` | Clonar repositorio |
| `pnpm/action-setup` | `v4` | Instalar pnpm |
| `actions/setup-node` | `v4` | Instalar Node.js 22 |
| `anthropic/claude-code-action` | `v1` | Ejecutar Claude como agente |

### 5.3 Control de Concurrencia

Solo R2 (PR Generator) necesita control de concurrencia, para evitar conflictos cuando se etiquetan multiples issues simultaneamente:

```yaml
concurrency:
  group: ai-generate-pr-${{ github.event.issue.number }}
  cancel-in-progress: true
```

Los demas workflows son idempotentes (sticky comments) o no generan conflictos.

### 5.4 Costes Estimados

| Agente | Turnos | Frecuencia estimada | Tokens/ejecucion |
|--------|--------|---------------------|-------------------|
| R1 — Issue Analyzer | 3 | 5-10/semana | ~5K |
| R2 — PR Generator | 15 | 3-5/semana | ~50K |
| R3 — PR Reviewer | 3 | 5-10/semana | ~10K |
| R5 — Doc Generator | 5 | 5-10/semana | ~5K |
| @claude Interactivo | 5 | 2-3/semana | ~15K |

**Estimacion semanal**: ~300K-500K tokens con `claude-sonnet-4-5-20250929`.

---

## 6. CHANGELOG

### 6.1 Formato

Se usa el estandar [Keep a Changelog](https://keepachangelog.com/es/1.1.0/) adaptado al espanol.

### 6.2 Plantilla Inicial

```markdown
# Changelog

Todos los cambios notables en este proyecto seran documentados en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/).
Este proyecto no usa versionado semantico; las entradas se agrupan por fecha.
```

### 6.3 Categorias

| Categoria | Uso |
|-----------|-----|
| **Anadido** | Funcionalidades nuevas |
| **Cambiado** | Cambios en funcionalidades existentes |
| **Corregido** | Correcciones de bugs |
| **Eliminado** | Funcionalidades o codigo removido |

### 6.4 Reglas de Generacion

- Cada PR mergeada genera exactamente una entrada
- Si varias PRs se mergean el mismo dia, las entradas se acumulan bajo la misma fecha
- Cada item referencia el numero de PR: `(#N)`
- Los items deben ser concisos (1 linea) y en espanol
- No se incluyen PRs de solo documentacion o CI (a criterio del agente)

---

## 7. Decisiones de Diseno (ADRs)

### ADR-1: claude-code-action sobre API directa

**Contexto**: Se evaluo usar la API de Claude directamente desde un script en GitHub Actions vs. usar `claude-code-action`.

**Decision**: Usar `anthropic/claude-code-action@v1`.

**Rationale**:
- Claude Code tiene acceso completo al repositorio (lectura y escritura)
- Puede ejecutar comandos bash (tests, lints, builds)
- Puede usar `gh` CLI para interactuar con GitHub (crear PRs, comentar)
- Maneja multiples turnos automaticamente (agentic loop)
- Menor codigo de infraestructura a mantener

**Consecuencias**:
- Dependencia de Anthropic para el mantenimiento de la action
- Menor control granular sobre cada llamada a la API
- Mayor consumo de tokens por la carga de contexto del repo

---

### ADR-2: Sticky comments sobre multiples comentarios

**Contexto**: Cuando un agente actualiza su analisis (ej: re-trigger de R1), puede crear un nuevo comentario o actualizar el existente.

**Decision**: Usar sticky comments (actualizar el mismo comentario).

**Rationale**:
- Evita spam de comentarios en issues/PRs
- El comentario siempre refleja el analisis mas reciente
- `claude-code-action` soporta sticky comments nativamente

**Consecuencias**:
- Se pierde el historico de revisiones anteriores (mitigado por git log)
- Mejor experiencia de lectura para el desarrollador

---

### ADR-3: Review informativa, nunca bloquea merge

**Contexto**: R3 podria configurarse como required check que bloquee el merge si detecta problemas.

**Decision**: R3 es solo informativo. Nunca bloquea el merge.

**Rationale**:
- El proyecto es desarrollado por un unico desarrollador (con experiencia)
- Los falsos positivos de IA bloquearian el flujo innecesariamente
- El humano siempre tiene contexto adicional que la IA no posee
- Mejor adopcion si el agente ayuda sin estorbar

**Consecuencias**:
- El desarrollador puede ignorar sugerencias validas
- Menor friccion en el flujo de desarrollo
- Confianza gradual: si R3 demuestra precision, podria promoverse a required en el futuro

---

### ADR-4: Pre-instalar dependencias antes de Claude en R2

**Contexto**: R2 necesita ejecutar `pnpm install`, `pnpm typecheck`, `pnpm test`, etc. Si Claude lo hace en sus turnos, consume tokens y turnos.

**Decision**: Ejecutar `pnpm install` como step previo al step de claude-code-action.

**Rationale**:
- `pnpm install` es deterministico y no requiere razonamiento de IA
- Ahorra ~2 turnos y ~5K tokens por ejecucion
- El node_modules esta disponible cuando Claude necesita ejecutar tests

**Consecuencias**:
- Workflow mas largo en steps pero mas eficiente en tokens
- Claude puede asumir que las dependencias ya estan instaladas

---

### ADR-5: CHANGELOG en espanol

**Contexto**: El proyecto usa espanol para commits, documentacion y UI. El CHANGELOG podria ser en ingles (estandar de la industria) o en espanol (consistente con el proyecto).

**Decision**: CHANGELOG en espanol.

**Rationale**:
- Consistencia con el resto del proyecto (commits, docs, specs, UI)
- El publico objetivo (TFM academico) es hispanohablante
- Keep a Changelog tiene version en espanol

**Consecuencias**:
- Menor legibilidad para contribuidores no hispanohablantes (no aplica en este proyecto)
- Categorias en espanol: Anadido, Cambiado, Corregido, Eliminado

---

## 8. Flujos de Uso

### 8.1 Flujo completo: Issue → PR → Merge → CHANGELOG

```
1. Desarrollador crea issue en GitHub
   │
2. Anade label "ai-analyze"
   │
   ▼
3. R1 (Issue Analyzer) se ejecuta
   → Publica comentario sticky con analisis
   → Complejidad, archivos, riesgos, enfoque, estimacion
   │
4. Desarrollador revisa analisis de R1
   → Si correcto: anade label "ai-generate-pr"
   → Si incorrecto: ajusta la issue y re-trigger
   │
   ▼
5. R2 (PR Generator) se ejecuta
   → Crea rama ai/issue-{N}-{slug}
   → Implementa cambios
   → Ejecuta typecheck + lint + test
   → Abre PR con label "ai-generated" y "Closes #{N}"
   │
   ▼
6. R3 (PR Reviewer) se ejecuta automaticamente
   → Publica comentario sticky con review
   → Anade label "ai-reviewed"
   │
7. Desarrollador revisa PR
   → Si OK: aprueba y mergea
   → Si cambios necesarios: comenta o edita manualmente
   │
   ▼
8. R5 (Doc Generator) se ejecuta post-merge
   → Actualiza CHANGELOG.md
   → Commit + push a main
```

### 8.2 Flujo manual: PR humana → Review → Merge → CHANGELOG

```
1. Desarrollador crea PR manualmente (desde Claude Code local)
   │
   ▼
2. R3 (PR Reviewer) se ejecuta automaticamente
   → Publica comentario sticky con review
   → Anade label "ai-reviewed"
   │
3. Desarrollador mergea PR
   │
   ▼
4. R5 (Doc Generator) se ejecuta
   → Actualiza CHANGELOG.md
```

### 8.3 Flujo interactivo: @claude en comentario

```
1. Desarrollador escribe comentario en issue o PR:
   "@claude explica como funciona el rate limiting de la API de IA"
   │
   ▼
2. Workflow ai-claude-interactive se ejecuta
   → Claude lee el contexto (issue/PR + repo)
   → Responde con comentario detallado
   │
3. Desarrollador puede hacer follow-up:
   "@claude implementa el cambio que sugieres en un commit"
   │
   ▼
4. Claude puede crear commits directamente en la rama de la PR
```

---

## 9. Verificacion

### 9.1 Checklist de Testing por Workflow

#### R1 — Issue Analyzer
- [ ] Crear issue de prueba con titulo y descripcion
- [ ] Anadir label `ai-analyze`
- [ ] Verificar que el workflow se ejecuta (Actions tab)
- [ ] Verificar comentario sticky con las 6 secciones
- [ ] Re-trigger: verificar que el comentario se actualiza (no se duplica)

#### R2 — PR Generator
- [ ] Crear issue con label `ai-generate-pr`
- [ ] Verificar que se crea rama `ai/issue-{N}-{slug}`
- [ ] Verificar que la PR se abre con label `ai-generated`
- [ ] Verificar que la descripcion incluye `Closes #{N}`
- [ ] Verificar que typecheck/lint/test pasan en la PR
- [ ] Verificar concurrencia: etiquetar 2 issues y confirmar que no hay conflictos

#### R3 — PR Reviewer
- [ ] Abrir PR manualmente
- [ ] Verificar que R3 se ejecuta automaticamente
- [ ] Verificar comentario sticky con las 6 secciones
- [ ] Verificar label `ai-reviewed` anadida
- [ ] Verificar que no se ejecuta en PRs de dependabot
- [ ] Hacer push a la PR y verificar que el review se actualiza

#### R5 — Doc Generator
- [ ] Mergear PR de prueba
- [ ] Verificar que CHANGELOG.md se actualiza
- [ ] Verificar formato correcto (fecha, categorias, numero de PR)
- [ ] Verificar commit automatico en main
- [ ] Mergear 2 PRs el mismo dia: verificar que se acumulan bajo la misma fecha

#### @claude Interactivo
- [ ] Comentar `@claude hola` en una issue
- [ ] Verificar que Claude responde
- [ ] Comentar `@claude que archivos tiene el proyecto?` en una PR
- [ ] Verificar que Claude lee el repo y responde

### 9.2 Validacion General

- [ ] Todos los workflows aparecen en la pestana Actions de GitHub
- [ ] `ANTHROPIC_API_KEY` configurado como repository secret
- [ ] Las 16 labels estan creadas en el repositorio
- [ ] `CHANGELOG.md` existe en la raiz del proyecto
- [ ] Los 4 archivos de prompt existen en `prompts/remote/`
- [ ] `pnpm typecheck`, `pnpm build`, `pnpm lint` pasan sin errores

---

## 10. Archivos Creados/Modificados

### 10.1 Archivos Nuevos

| # | Archivo | Proposito |
|---|---------|-----------|
| 1 | `.github/workflows/ai-analyze-issue.yml` | Workflow R1: analisis de issues |
| 2 | `.github/workflows/ai-generate-pr.yml` | Workflow R2: generacion de PRs |
| 3 | `.github/workflows/ai-review-pr.yml` | Workflow R3: review de PRs |
| 4 | `.github/workflows/ai-update-changelog.yml` | Workflow R5: actualizacion CHANGELOG |
| 5 | `.github/workflows/ai-claude-interactive.yml` | Workflow @claude interactivo |
| 6 | `prompts/remote/issue-analyzer.md` | Prompt para R1 |
| 7 | `prompts/remote/pr-generator.md` | Prompt para R2 |
| 8 | `prompts/remote/pr-reviewer.md` | Prompt para R3 |
| 9 | `prompts/remote/doc-generator.md` | Prompt para R5 |
| 10 | `CHANGELOG.md` | Registro de cambios del proyecto |

### 10.2 Archivos Modificados

| # | Archivo | Cambio |
|---|---------|--------|
| 1 | `CLAUDE.md` | Anadir referencia a Fase 4, workflows, labels |
| 2 | `docs/03-AGENTS-AND-DEVELOPMENT-PLAN.md` | Actualizar diagrama con agentes concretos |

### 10.3 Resumen

- **10 archivos nuevos**: 5 workflows + 4 prompts + 1 CHANGELOG
- **2 archivos modificados**: documentacion existente
- **0 archivos de codigo fuente** modificados (Fase 4 no afecta al codigo de la aplicacion)

---

## 11. Criterios de Aceptacion

- [ ] 5 workflows configurados y funcionales en GitHub Actions
- [ ] 4 archivos de prompt en `prompts/remote/`
- [ ] 16 labels creadas en el repositorio
- [ ] `CHANGELOG.md` generado tras primer merge
- [ ] R1 publica analisis en issues etiquetadas con `ai-analyze`
- [ ] R2 genera PRs funcionales desde issues etiquetadas con `ai-generate-pr`
- [ ] R3 revisa automaticamente cada PR (sin bloquear merge)
- [ ] R5 actualiza CHANGELOG tras cada merge a main
- [ ] `@claude` responde en comentarios de issues y PRs
- [ ] Ningun workflow modifica codigo de la aplicacion (solo infra CI/CD)
- [ ] Secret `ANTHROPIC_API_KEY` configurado en el repositorio
