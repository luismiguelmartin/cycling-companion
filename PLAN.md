# Plan: Demo Mode con Mock Data

## Resumen
Crear un modo demo accesible desde la pantalla de login que permite a usuarios no registrados explorar todas las pantallas de la aplicación (onboarding + interiores) con datos mock de febrero 2026. Se presenta en un modal grande tipo carrusel con navegación anterior/siguiente y descripción de cada pantalla.

---

## Arquitectura

### Enfoque
- **Datos 100% en memoria** — sin BBDD, sin API calls
- **Reutilizar componentes existentes** — pasar mock data como props a `ActivitiesContent`, `PlanContent`, `InsightsContent`, `ProfileContent`
- **Dashboard y Onboarding** — crear versiones client-side ya que el dashboard actual es Server Component y el onboarding tiene lógica de Supabase
- **Interacción deshabilitada** — las pantallas demo son de solo lectura (se capturan clicks en links para evitar navegación)

### Flujo del usuario
1. Login → ve botón "Ver demo" debajo de "Continuar con Google"
2. Click → se abre modal fullscreen con carrusel
3. Navega 9 pantallas con flechas ← → y dots de paginación
4. Cada pantalla tiene título + descripción contextual arriba
5. Cierra con X o botón "Empezar gratis"

---

## Pantallas del carrusel (9 slides)

| # | Pantalla | Descripción |
|---|----------|-------------|
| 1 | Onboarding: Datos básicos | Completa tu perfil con nombre, edad y peso |
| 2 | Onboarding: Rendimiento | Añade FTP, FC máxima y FC en reposo |
| 3 | Onboarding: Objetivo | Elige tu objetivo de entrenamiento |
| 4 | Onboarding: Resumen | Tu perfil completo y bienvenida del coach IA |
| 5 | Dashboard | Vista general: KPIs, gráficas de potencia/carga y tip del coach IA |
| 6 | Actividades | Historial de sesiones con filtros por tipo |
| 7 | Planificación | Plan semanal generado por IA con detalle por día |
| 8 | Insights | Comparativa entre periodos con radar y análisis IA |
| 9 | Perfil | Tu perfil, zonas de potencia/FC y ajustes |

---

## Mock Data (febrero 2026)

### Perfil del ciclista demo
- **Nombre**: Carlos García
- **Edad**: 45 años, **Peso**: 78 kg
- **FTP**: 230W, **FC máx**: 178 bpm, **FC reposo**: 52 bpm
- **Objetivo**: Mejorar rendimiento (performance)

### Actividades (~18 sesiones en febrero)
Distribución realista para ciclista amateur 40+:
- 4-5 sesiones/semana (lun-dom)
- Mix: ~30% endurance, ~25% intervals, ~20% tempo, ~15% recovery, ~10% rest
- Con distancia, potencia, FC, cadencia, TSS, RPE y análisis IA generados
- Actividades desde 2026-02-01 hasta 2026-02-19 (hoy)

### Planes semanales (4 semanas completas)
- Semana 1: 2–8 feb (mostrar en el carrusel)
- Semana 2: 9–15 feb
- Semana 3: 16–22 feb (semana actual — la que se muestra por defecto)
- Semana 4: 23 feb – 1 mar
- Cada plan tiene 7 días con tipo, intensidad, duración, descripción, nutrición, descanso

### Insights
- Periodo A: 2–8 feb (Semana 5)
- Periodo B: 9–15 feb (Semana 6)
- 6 métricas de comparación + 6 dimensiones radar + análisis IA

### Dashboard KPIs (semana actual)
- Distancia, tiempo, potencia media, FC media pre-calculados
- Tendencias vs semana anterior
- Datos para gráficas (power trend 4 semanas + daily load)

---

## Archivos a crear

### 1. `apps/web/src/lib/demo/mock-data.ts`
Módulo central con todos los datos mock:
- `DEMO_PROFILE` — perfil del ciclista
- `DEMO_ACTIVITIES` — array de ~18 actividades
- `DEMO_PLAN_DAYS` — PlanDay[] para la semana actual
- `DEMO_ALL_PLANS` — 4 planes semanales completos
- `DEMO_INSIGHTS` — períodos, métricas, radar, análisis
- `DEMO_DASHBOARD` — KPIs, trends, chart data, coach tip
- `DEMO_OVERLOAD` — datos de sobrecarga (warning level para que se vea la alerta)

### 2. `apps/web/src/lib/demo/screen-config.ts`
Configuración de las 9 pantallas:
- `id`, `title`, `description` para cada slide
- Usado por el modal para renderizar headers

### 3. `apps/web/src/components/demo/demo-modal.tsx`
Modal principal — Client Component:
- Overlay fullscreen con backdrop blur
- Contenedor central `max-w-5xl` con altura ~90vh
- Header: título de pantalla + descripción + indicador (3/9)
- Zona de contenido scrollable con la pantalla renderizada
- Footer: dots de paginación + flechas prev/next
- Botón X para cerrar + botón "Empezar gratis" (cierra modal, scroll to login)
- Navegación también con teclas ← → y Escape
- Transiciones suaves entre slides

### 4. `apps/web/src/components/demo/demo-dashboard.tsx`
Réplica client-side del dashboard:
- Reutiliza `KPICard`, `AICoachCard`, `OverloadAlert`, `RecentActivityItem`
- Reutiliza `PowerTrendChart`, `DailyLoadChart`
- Recibe todo como props desde mock data
- Sin fetch, sin server actions

### 5. `apps/web/src/components/demo/demo-onboarding-step.tsx`
Renderiza un paso concreto del onboarding con datos pre-rellenados:
- Recibe `step` (0-3) y `data` del perfil demo
- Reutiliza `OnboardingField`, `GoalCard`, `StepIndicator`, `ProfileSummary`, `AICoachWelcome`
- Sin lógica de estado ni Supabase calls
- Visual match con el wizard real pero estático

### 6. `apps/web/src/components/demo/demo-screen-wrapper.tsx`
Wrapper para pantallas interiores en el demo:
- Simula el `AppShell` visualmente (sidebar mini + content area)
- Captura clicks en `<a>` para evitar navegación (`e.preventDefault()`)
- Contenido scrollable dentro del modal

## Archivo a modificar

### 7. `apps/web/src/app/(auth)/login/login-content.tsx`
- Importar `DemoModal`
- Añadir estado `showDemo`
- Botón "Ver demo" debajo de `<LoginButton />`
  - Estilo: borde outline, mismo ancho, icono Eye/Play
  - Texto: "Ver demo" o "Explorar sin cuenta"
- Renderizar `{showDemo && <DemoModal onClose={() => setShowDemo(false)} />}`

---

## Orden de implementación

1. **Mock data** (`mock-data.ts`) — base de todo
2. **Screen config** (`screen-config.ts`) — definiciones de slides
3. **Demo onboarding step** — componente para los 4 slides de onboarding
4. **Demo dashboard** — componente client para el slide de dashboard
5. **Demo screen wrapper** — wrapper para simular AppShell en pantallas interiores
6. **Demo modal** — contenedor principal con carrusel y navegación
7. **Login page** — añadir botón y conectar modal
8. **Tests** — tests unitarios para mock data y componentes demo
9. **Lint + typecheck + build** — validar que todo compila

---

## Notas técnicas

- `login-content.tsx` es "use client" → puede tener estado para el modal
- Los componentes de charts (`PowerTrendChart`, `DailyLoadChart`, `PerformanceRadarChart`) ya son Client Components → reutilizables directamente
- `PlanContent` intentará hacer `apiClientPost` si se pulsa "Recalcular" → fallará silenciosamente (ok para demo)
- `ProfileContent` tiene server action `saveProfile` → fallará silenciosamente (ok para demo)
- El modal se renderiza con React Portal (`createPortal`) para evitar z-index issues
- Keyboard navigation: ← → para slides, Escape para cerrar
