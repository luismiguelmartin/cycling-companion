# CI/CD Setup

## Estructura de Workflows

El proyecto utiliza **workflows separados por app** para optimizar tiempos de CI y claridad en los checks.

```
.github/workflows/
├── ci-frontend.yml    # Web + Shared
├── ci-backend.yml     # API + Shared
└── ci-legacy.yml.bak  # Workflow monolítico original (backup)
```

## Workflows Activos

### 🌐 CI Frontend (`ci-frontend.yml`)

**Triggers:**
- Push a `main` cuando cambian:
  - `apps/web/**`
  - `packages/shared/**`
  - `pnpm-lock.yaml`, `package.json`, `turbo.json`
- Pull requests con los mismos paths

**Jobs:**
1. Lint (web + shared)
2. Type check (web + shared)
3. Format check (web + shared)
4. Test (web + shared)
5. Build (web)

**Tiempo estimado:** ~1-1.5 min (vs 2-3 min del workflow monolítico)

### ⚙️ CI Backend (`ci-backend.yml`)

**Triggers:**
- Push a `main` cuando cambian:
  - `apps/api/**`
  - `packages/shared/**`
  - `pnpm-lock.yaml`, `package.json`, `turbo.json`
- Pull requests con los mismos paths

**Jobs:**
1. Lint (api + shared)
2. Type check (api + shared)
3. Format check (api + shared)
4. Test (api + shared)
5. Build (api)

**Tiempo estimado:** ~1 min (vs 2-3 min del workflow monolítico)

## Escenarios de Uso

### ✅ PR solo modifica Frontend
```bash
# Ejemplo: cambio en apps/web/src/components/Button.tsx
Workflows ejecutados:
  ✅ ci-frontend.yml
  ⏭️  ci-backend.yml (skipped, sin cambios en api/)
```

### ✅ PR solo modifica Backend
```bash
# Ejemplo: cambio en apps/api/src/routes/activities.ts
Workflows ejecutados:
  ⏭️  ci-frontend.yml (skipped)
  ✅ ci-backend.yml
```

### ✅ PR modifica `packages/shared/`
```bash
# Ejemplo: cambio en packages/shared/src/schemas/activity.ts
Workflows ejecutados:
  ✅ ci-frontend.yml (shared afecta a web)
  ✅ ci-backend.yml (shared afecta a api)
```
**Comportamiento esperado:** Ambos workflows corren en paralelo porque `shared` es dependencia de ambas apps.

### ✅ PR modifica ambos (web + api)
```bash
# Ejemplo: cambios en apps/web/ y apps/api/
Workflows ejecutados:
  ✅ ci-frontend.yml
  ✅ ci-backend.yml
```

## Badges para README.md

Añade estos badges al README para mostrar el estado de CI por separado:

```markdown
[![CI Frontend](https://github.com/USUARIO/cycling-companion/actions/workflows/ci-frontend.yml/badge.svg)](https://github.com/USUARIO/cycling-companion/actions/workflows/ci-frontend.yml)
[![CI Backend](https://github.com/USUARIO/cycling-companion/actions/workflows/ci-backend.yml/badge.svg)](https://github.com/USUARIO/cycling-companion/actions/workflows/ci-backend.yml)
```

## Variables de Entorno (GitHub Secrets)

### Frontend (ci-frontend.yml)
El build de Next.js requiere estas variables (opcional, usa placeholders por defecto):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL`

Si no están configuradas, usa valores placeholder que permiten el build pero no funcionarían en runtime.

### Backend (ci-backend.yml)
No requiere secrets para CI (build y tests no necesitan conexión a Supabase).

## Deploy Automatizado (Fase 2 - Futuro)

### Vercel (Frontend)
**Recomendación:** Usar Vercel GitHub Integration (zero config)
1. Conectar repo en Vercel Dashboard
2. Auto-deploy en push a `main`
3. Preview deployments automáticos en PRs

**Alternativa:** Vercel CLI en GitHub Actions (requiere `VERCEL_TOKEN` secret)

### Render (Backend)
**Recomendación:** Usar Render Auto-Deploy
1. Conectar repo en Render Dashboard
2. Auto-deploy en push a `main`

**Alternativa:** Deploy Hook (requiere `RENDER_DEPLOY_HOOK` secret)

## Ventajas de la Separación

| Aspecto | Workflow Monolítico | Workflows Separados |
|---------|---------------------|---------------------|
| **Tiempo CI (solo web)** | ~2-3 min | ~1-1.5 min ⚡ |
| **Tiempo CI (solo api)** | ~2-3 min | ~1 min ⚡ |
| **Claridad en fallos** | ❌ Ambiguo | ✅ Específico |
| **Cachés** | Global | Por app, granular ⚡ |
| **Escalabilidad** | ❌ Lineal | ✅ Modular |
| **DX en PRs** | 🤷 Genérico | 🎯 Específico |

## Troubleshooting

### ❌ Ambos workflows corren cuando solo cambié frontend
**Causa:** Cambiaste algo en `packages/shared/` también
**Solución:** Es correcto, shared afecta a ambas apps

### ❌ El workflow no se ejecuta
**Causa:** Los paths no matchean ningún archivo cambiado
**Solución:** Revisa que el path del archivo esté en los triggers del workflow

### ❌ Build falla por variables de entorno faltantes
**Causa:** Next.js requiere `NEXT_PUBLIC_*` en build time
**Solución:** Añadir secrets en GitHub repo settings o usar placeholders

## Mantenimiento

### Actualizar Node.js version
Cambiar en ambos workflows:
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 22  # Actualizar aquí
```

### Añadir nuevo job (ejemplo: E2E tests)
```yaml
- name: E2E tests
  run: pnpm --filter web test:e2e
```

### Actualizar pnpm version
```yaml
- uses: pnpm/action-setup@v4
  with:
    version: 9  # Especificar versión si es necesario
```

## Migración desde Workflow Monolítico

1. ✅ Workflows nuevos creados (`ci-frontend.yml`, `ci-backend.yml`)
2. ✅ Workflow antiguo renombrado a `ci-legacy.yml.bak` (desactivado)
3. ⏭️ Primera PR para testear workflows separados
4. ⏭️ Configurar deploy automatizado (Vercel + Render)
5. ⏭️ Actualizar README con badges separados

## Métricas (para validar la decisión)

Recopilar tras 2 semanas de uso:
- ✅ Tiempo promedio de CI antes vs después
- ✅ % de PRs que skipean frontend o backend
- ✅ Tiempo desde merge hasta deploy
- ✅ Incidentes por deploys innecesarios (objetivo: 0)
