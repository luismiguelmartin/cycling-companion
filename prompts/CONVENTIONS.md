# Convenciones Comunes — Cycling Companion

Este documento define las reglas compartidas por todos los agentes del pipeline. Cada prompt de agente lo referencia como base.

---

## 1. Idioma y Comunicación

- **Idioma**: español para toda la documentación, issues, PRs y commits.
- **Commits**: formato convencional en español → `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`.
- **Issues**: título en imperativo (`Implementar componente KPI Card`), descripción con criterios de aceptación.
- **PRs**: título corto, body con resumen + plan de test.

---

## 2. Documentos de Referencia

| Documento               | Ruta                                     | Contenido clave                                    |
| ----------------------- | ---------------------------------------- | -------------------------------------------------- |
| Visión del producto     | `docs/01-PRODUCT-VISION.md`              | Contexto, propuesta de valor, usuarios             |
| PRD                     | `docs/02-PRD.md`                         | Requisitos funcionales, modelo de datos, endpoints |
| Plan de agentes         | `docs/03-AGENTS-AND-DEVELOPMENT-PLAN.md` | Roles, fases, pipeline                             |
| Design System           | `docs/DESIGN-SYSTEM.md`                  | Tokens, componentes, conversión JSX→Tailwind       |
| Instrucciones de código | `CLAUDE.md`                              | Stack, comandos, convenciones                      |
| Mockups JSX             | `docs/design/*.jsx`                      | Fuente de verdad visual (no comiteados)            |

---

## 3. Stack Tecnológico

```
cycling-companion/              (Turborepo + pnpm)
├── apps/
│   ├── web/                    Next.js 16 (App Router, React 19, TypeScript, Tailwind CSS)
│   └── api/                    Fastify 5 (TypeScript, Zod)
├── packages/
│   └── shared/                 Types compartidos, schemas Zod, constantes
└── docs/                       Documentación del proyecto
```

- **Base de datos**: Supabase (PostgreSQL + Auth + Storage + RLS)
- **IA**: Claude API (Anthropic)
- **Deploy**: Vercel (web) · Render (API) · Supabase (DB)

---

## 4. Estructura de Archivos — Frontend

Estructura sugerida dentro de `apps/web/src/` (referencia: DESIGN-SYSTEM.md §6):

```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── onboarding/page.tsx
├── (app)/
│   ├── layout.tsx              ← Sidebar + main container
│   ├── dashboard/page.tsx
│   ├── activities/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── plan/page.tsx
│   ├── insights/page.tsx
│   └── profile/page.tsx
components/
├── ui/                         ← shadcn/ui base
├── kpi-card.tsx
├── ai-coach-card.tsx
├── activity-badge.tsx
├── rpe-indicator.tsx
├── step-indicator.tsx
├── goal-card.tsx
└── charts/
    ├── power-trend-chart.tsx
    ├── daily-load-chart.tsx
    ├── activity-timeseries-chart.tsx
    └── performance-radar-chart.tsx
```

---

## 5. Reglas de Código

### TypeScript

- `strict: true` — prohibido `any`.
- Interfaces TypeScript explícitas para props de componentes.
- Schemas Zod definidos una vez en `packages/shared`, reutilizados en web y API.

### React / Next.js

- **App Router** (nunca Pages Router).
- **Server Components por defecto** — solo `'use client'` cuando sea necesario (estado, efectos, eventos).
- Nomenclatura: PascalCase para componentes, kebab-case para archivos.
- Co-locación: `Button.tsx` + `Button.test.tsx` en la misma carpeta.

### Estilos

- **Tailwind CSS** exclusivamente — nunca inline styles ni CSS modules.
- **shadcn/ui** como base — personalizar con Tailwind antes de crear componentes desde cero.
- Tema dark/light con clases `dark:` y CSS custom properties en `globals.css` para tokens complejos.
- Mobile-first: diseñar para móvil primero, escalar con `md:`, `lg:`.

### API (Fastify)

- Schema Zod en cada ruta para validación automática.
- Manejo de errores consistente con códigos HTTP apropiados.
- RLS en Supabase: **nunca desactivar**.

### Supabase — Patrones de Cliente

- Client Components: `import { createClient } from '@/lib/supabase/client'`
- Server Components / Actions: `import { createClient } from '@/lib/supabase/server'`
- Middleware ya configurado en `apps/web/src/middleware.ts`.

---

## 6. Conversión JSX → Next.js (Resumen)

Tabla de transformaciones principales (detalle en DESIGN-SYSTEM.md §6.2):

| Patrón en mockup JSX       | Conversión a Next.js + Tailwind        |
| -------------------------- | -------------------------------------- |
| `style={{ padding: 12 }}`  | `className="p-3"`                      |
| `borderRadius: 14`         | `rounded-[14px]`                       |
| `"rgba(255,255,255,0.02)"` | `bg-white/[0.02]`                      |
| `"1px solid rgba(...)"`    | `border border-white/[0.06]`           |
| `isMobile ? X : Y`         | `clase-mobile md:clase-desktop`        |
| `linear-gradient(...)`     | CSS custom properties en `globals.css` |
| `boxShadow: "..."`         | `shadow-*` o CSS custom property       |
| Google Fonts link          | `next/font` con `DM_Sans`              |
| `t.t1`, `t.card`, `t.acc`  | Clases Tailwind + CSS variables        |

---

## 7. Tokens de Tema → Tailwind

### Dark Mode (por defecto)

| Token   | Valor                    | Tailwind              |
| ------- | ------------------------ | --------------------- |
| `bg`    | `#0c1320`                | `bg-[#0c1320]`        |
| `t1`    | `#f1f5f9`                | `text-slate-100`      |
| `t2`    | `#94a3b8`                | `text-slate-400`      |
| `t3`    | `#64748b`                | `text-slate-500`      |
| `t4`    | `#475569`                | `text-slate-600`      |
| `acc`   | `#f97316`                | `text-orange-500`     |
| `card`  | `rgba(255,255,255,0.02)` | `bg-white/[0.02]`     |
| `cardB` | `rgba(255,255,255,0.06)` | `border-white/[0.06]` |
| `inBg`  | `rgba(255,255,255,0.03)` | `bg-white/[0.03]`     |
| `inB`   | `rgba(255,255,255,0.08)` | `border-white/[0.08]` |

### Light Mode

| Token   | Valor              | Tailwind              |
| ------- | ------------------ | --------------------- |
| `bg`    | `#f8f9fb`          | `bg-slate-50`         |
| `t1`    | `#0f172a`          | `text-slate-950`      |
| `t2`    | `#475569`          | `text-slate-600`      |
| `acc`   | `#ea580c`          | `text-orange-600`     |
| `card`  | `rgba(0,0,0,0.02)` | `bg-black/[0.02]`     |
| `cardB` | `rgba(0,0,0,0.06)` | `border-black/[0.06]` |

### Tokens Complejos → CSS Custom Properties

```css
/* globals.css */
:root {
  --ai-bg: linear-gradient(135deg, rgba(249, 115, 22, 0.06), rgba(234, 88, 12, 0.02));
  --ai-border: rgba(249, 115, 22, 0.2);
  --hero-bg: linear-gradient(135deg, #f0f4f8, #e8ecf0, #f5f0eb);
}
.dark {
  --ai-bg: linear-gradient(135deg, rgba(249, 115, 22, 0.08), rgba(234, 88, 12, 0.04));
  --ai-border: rgba(249, 115, 22, 0.18);
  --hero-bg: linear-gradient(135deg, #0f1923, #162032, #1a1a2e);
}
```

---

## 8. Labels de GitHub

| Categoría   | Labels                                                                |
| ----------- | --------------------------------------------------------------------- |
| Tipo        | `type:feature`, `type:bug`, `type:refactor`, `type:docs`, `type:test` |
| Prioridad   | `priority:p0` (crítico), `priority:p1` (alto), `priority:p2` (medio)  |
| Fase        | `phase:1`, `phase:2`, `phase:3`                                       |
| AI Pipeline | `ai-analyze`, `ai-generate-pr`, `ai-generated`, `ai-reviewed`         |

---

## 9. Principios

1. **No sobre-ingeniería**: implementar solo lo necesario para la issue actual.
2. **Incrementalidad**: cada cambio deja el proyecto en estado funcional (`build`, `lint`, `typecheck` pasan).
3. **Trazabilidad**: cada PR enlaza a su issue, cada issue a su diseño técnico.
4. **Separación de responsabilidades**: L1 analiza, L2 diseña, L3 planifica, L4 implementa. No saltarse pasos.
5. **Supervisión humana**: L4 requiere aprobación antes de ejecutar. Nunca commit automático.
6. **Seguridad primero**: RLS activo, validar inputs con Zod, nunca commitear secrets.

---

## 10. Tipos de Entrenamiento

| Tipo        | Color             | Emoji |
| ----------- | ----------------- | ----- |
| `intervals` | Rojo `#ef4444`    | ⚡    |
| `endurance` | Verde `#22c55e`   | 🚴    |
| `recovery`  | Azul `#3b82f6`    | 💆    |
| `tempo`     | Naranja `#f97316` | 🔥    |
| `rest`      | Gris `#6b7280`    | 😴    |
