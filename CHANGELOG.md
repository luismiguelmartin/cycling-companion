# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/).

## [Sin versionar]

### Añadido

- Fase 1: Monorepo (Turborepo + pnpm), Auth Google (Supabase), deploy Vercel/Render, onboarding 4 pasos
- Fase 2: 8 pantallas frontend (dashboard, actividades, detalle, import, plan, insights, perfil, login)
- Fase 2: Design system documentado, 22 specs L1/L2/L3, schemas Zod compartidos
- Fase 3: API Fastify con 15+ endpoints (perfil, actividades, insights, plan, import, IA)
- Fase 3: 4 endpoints IA con Claude API (análisis, plan semanal, resumen, coach tip)
- Fase 3: Importación .fit/.gpx con Normalized Power y extensiones Garmin
- Fase 3: Frontend migrado de Supabase directo a API backend
- Fase 3: 290 tests (72 web + 82 shared + 136 API)
- Fase 4: Agentes remotos GitHub Actions (R1 analyzer, R2 generator, R3 reviewer, R5 docs)
- Fase 4: Sistema de 16 labels para pipeline AI-first
- Fase 4: Handler interactivo @claude en issues y PRs
- Fase 4: CHANGELOG automático en merge de PRs
- Constante `RPE_DESCRIPTIONS` con descripciones en español para RPE 1-10 (#13)
- Constante `MAX_RPE` para el valor máximo de RPE (#18)
- Campo `version` al endpoint `/health` (#26)
- Diapositivas de presentación para MVP de Cycling Companion (#29)

### Cambiado

- Actualización de modelos Claude a claude-sonnet-4-6 en workflows y API (#28)

### Corregido

- CI workflows para respetar pipeline de dependencias usando turbo run (#22)
- Posición del botón cerrar en menú móvil (#20)
- Manejo de fechas UTC en dashboard y backend (#21)
- Revisión del menú móvil y mejoras de usabilidad (#23)
- Manejo de errores en guardado de perfil y propagación de errores backend (#24)
- Errores de formato Prettier y ampliación de exclusiones en CI (#25)
- Migración de guardado de perfil a Server Action para evitar errores de red (#27)
