# L1 — Spec Funcional: Dashboard

> **Fuente**: `docs/design/cycling-companion-full-app.jsx`
> **Requisito PRD**: F02 — Dashboard principal (P0)
> **Fecha**: 2026-02-14

---

## 1. Resumen de la Pantalla

El Dashboard es la pantalla principal de la aplicación una vez completado el onboarding. Muestra un resumen del estado de entrenamiento del ciclista con KPIs, gráficas, recomendaciones IA y actividades recientes.

| Pantalla | Componente JSX | Propósito |
|----------|---------------|-----------|
| **Dashboard** | `DashboardPage` | Vista rápida del estado de entrenamiento con KPIs semanales, tendencias, recomendación IA y actividades recientes. |

**Requisito PRD asociado**: F02 — Vista rápida del estado de entrenamiento. KPI Cards, gráfica de tendencia, tarjeta IA, alerta de sobrecarga, accesos rápidos.

---

## 2. Ruta y Navegación

### Rutas propuestas

| Pantalla | Ruta | Route Group |
|----------|------|-------------|
| Dashboard | `/` | `(app)` |

### Flujo de navegación

```
Usuario autenticado → /
                      │
          ┌───────────┴───────────┐
          │                       │
   Tiene perfil            No tiene perfil
          │                       │
    / (dashboard)          /onboarding
```

### Condiciones de acceso

| Ruta | Auth requerida | Condición adicional |
|------|---------------|---------------------|
| `/` | Sí | Si no completó onboarding → redirect a `/onboarding` |

**Nota**: El middleware actual solo verifica autenticación. La verificación de onboarding completado se hace en el Server Component `page.tsx` (ya implementado en el placeholder actual).

---

## 3. Componentes Identificados

### 3.1 Layout — Sidebar

#### Sidebar

| Campo | Valor |
|-------|-------|
| **Nombre** | `Sidebar` |
| **Tipo** | Client Component — necesita estado para mobile menu + `usePathname()` para marcar nav activa |
| **Props** | `userName: string` (obligatoria), `userEmail: string` (obligatoria) |
| **Estados** | Desktop: sidebar fija visible. Mobile: oculta, toggle con hamburger. |
| **Tokens** | Fondo: `sidebar` (gradient vertical). Borde derecho: `cardB`. |
| **Responsive** | Desktop: 220px fija, siempre visible. Mobile: overlay fullscreen con `backdrop-filter: blur(12px)`. |
| **Contenido** | Logo, 5 items de navegación, toggle de tema, info de usuario |
| **Reutilizable** | Sí — layout compartido para todas las pantallas de la app (Dashboard, Actividades, Plan, Insights, Perfil) |

**Items de navegación del Sidebar**:

| Icono | Label | Ruta | Marca activa cuando |
|-------|-------|------|---------------------|
| `Activity` | Dashboard | `/` | pathname === `/` |
| `BarChart3` | Actividades | `/activities` | pathname.startsWith(`/activities`) |
| `Calendar` | Planificación | `/plan` | pathname === `/plan` |
| `TrendingUp` | Insights | `/insights` | pathname === `/insights` |
| `User` | Perfil | `/profile` | pathname === `/profile` |

**Estilos de navegación**:

| Estado | Fondo | Texto | Icono |
|--------|-------|-------|-------|
| Inactivo | transparente | `t2` (13px, weight 400) | `t3` (18px) |
| Activo | `actBg` | `acc` (13px, weight 600) | `acc` (18px) |
| Hover (inactivo) | `rgba(255,255,255,0.04)` (dark) / `rgba(0,0,0,0.04)` (light) | — | — |

**Sección inferior del Sidebar**:
- ThemeToggle (reutilizado del auth flow)
- Info de usuario: avatar con iniciales + nombre + email (texto truncado)

#### MobileHeader

| Campo | Valor |
|-------|-------|
| **Nombre** | `MobileHeader` (inline en Sidebar) |
| **Tipo** | Client Component |
| **Props** | Ninguna (comparte estado con Sidebar) |
| **Estados** | Menu cerrado: header con logo + hamburger. Menu abierto: overlay fullscreen. |
| **Tokens** | Fondo: `bg`. Borde inferior: `cardB`. Altura: 56px. |
| **Responsive** | Solo visible en mobile (< 768px) |
| **Contenido** | Logo (Zap icon + "Cycling Companion") a la izquierda, botón hamburger (`Menu` / `X` icon) a la derecha |

---

### 3.2 Dashboard — Contenido principal

#### DashboardHeader

| Campo | Valor |
|-------|-------|
| **Nombre** | `DashboardHeader` |
| **Tipo** | Server Component — solo renderiza contenido basado en props |
| **Props** | `userName: string` (obligatoria), `weekNumber: number` (obligatoria), `activityCount: number` (obligatoria) |
| **Estados** | Default único |
| **Tokens** | Saludo: `t1` (26px, weight 700). Resumen: `t2` (13px). |
| **Responsive** | Desktop: 26px. Mobile: 22px. |
| **Contenido** | "Buenos días, {nombre} 👋" + "Semana {N} · {X} actividades esta semana" |

**Nota sobre el saludo**: Se adapta a la hora del día:
- 6:00-11:59 → "Buenos días"
- 12:00-17:59 → "Buenas tardes"
- 18:00-5:59 → "Buenas noches"

#### OverloadAlert

| Campo | Valor |
|-------|-------|
| **Nombre** | `OverloadAlert` |
| **Tipo** | Server Component — se muestra condicionalmente basado en datos |
| **Props** | `currentLoad: number` (obligatoria), `avgLoad: number` (obligatoria) |
| **Estados** | **Amarillo**: carga 120-149% de la media. **Rojo**: carga >= 150% de la media. **Oculto**: carga < 120%. |
| **Tokens** | Amarillo: fondo `rgba(234,179,8,0.1)` (dark) / `rgba(234,179,8,0.06)` (light), borde `rgba(234,179,8,0.3)` / `rgba(234,179,8,0.4)`. Rojo: fondo `rgba(239,68,68,0.1)`, borde `rgba(239,68,68,0.3)`. |
| **Responsive** | Sin diferencias — banner full width |
| **Contenido** | Icono `AlertTriangle` + "Carga semanal elevada: {X}% por encima de tu media. Considera reducir la intensidad." |
| **Reutilizable** | No — específico del Dashboard |

**Umbrales (ref: PRD §4 — F09)**:
- TSS semanal > 1.2x media últimas 4 semanas → alerta amarilla
- TSS semanal > 1.5x media últimas 4 semanas → alerta roja
- Más de 3 días consecutivos de alta intensidad → alerta de descanso

#### KPICard

| Campo | Valor |
|-------|-------|
| **Nombre** | `KPICard` |
| **Tipo** | Server Component — solo renderiza datos |
| **Props** | `icon: LucideIcon` (obligatoria), `iconColor: string` (obligatoria), `value: number \| string` (obligatoria), `unit: string` (obligatoria), `label: string` (obligatoria), `trend?: { direction: 'up' \| 'down', percentage: number }` (opcional) |
| **Estados** | Default único. Trend badge es condicional (si hay datos de semana anterior). |
| **Tokens** | Card fondo: `card`. Card borde: `cardB`. Valor: `t1` (26px desktop / 20px mobile, weight 700). Unidad: `t2` (13px). Label: `t3` (12px). Icono contenedor: `{iconColor}` al 15% opacidad, borderRadius 10px, 40x40px. Trend positiva: `#22c55e` (texto + fondo 10%). Trend negativa: `#ef4444` (texto + fondo 10%). |
| **Responsive** | Grid 4 cols desktop, 2x2 mobile. Valor: 26px desktop, 20px mobile. |
| **Contenido** | Icono con fondo coloreado + badge de tendencia (esquina superior derecha) + valor grande + unidad + label |
| **Reutilizable** | Sí — patrón de KPI card usado en Dashboard y potencialmente en otras pantallas |

**Las 4 KPI Cards del Dashboard**:

| # | Icono | Color | Label | Valor | Unidad |
|---|-------|-------|-------|-------|--------|
| 1 | `Activity` | `#f97316` | Distancia | SUM(distance_km) semana | km |
| 2 | `Clock` | `#8b5cf6` | Tiempo | SUM(duration_seconds) semana (formateado HH:MM) | h |
| 3 | `Zap` | `#22c55e` | Potencia media | AVG(avg_power_watts) semana | W |
| 4 | `Heart` | `#ef4444` | FC media | AVG(avg_hr_bpm) semana | bpm |

**Tendencia**: Comparación con semana anterior. Para FC, la lógica de tendencia se invierte (bajar FC es positivo).

#### PowerTrendChart

| Campo | Valor |
|-------|-------|
| **Nombre** | `PowerTrendChart` |
| **Tipo** | Client Component — Recharts requiere acceso al DOM |
| **Props** | `data: Array<{ week: string, power: number, hr: number }>` (obligatoria) |
| **Estados** | Default único (sin interacción) |
| **Tokens** | Card fondo: `card`. Card borde: `cardB`. Título card: `t1` (14px, weight 600). Gradient: naranja al 25% opacidad → 0%. Grid: `rgba(255,255,255,0.04)` (dark) / `#e2e8f0` (light). Ejes: `t3` (10px). |
| **Responsive** | Height 220px desktop, 180px mobile. Card padding 20px desktop, 14px mobile. |
| **Contenido** | Título "Tendencia de potencia" + AreaChart con gradient naranja (potencia) + línea azul (FC) + tooltip |
| **Reutilizable** | Parcialmente — el patrón AreaChart con gradient se reutiliza en Detalle de Actividad |

**Configuración Recharts**:
- `AreaChart` con datos de 4 semanas
- Área con `fill: url(#powerGradient)`, `stroke: #f97316`
- Línea FC: `stroke: #ef4444`, `strokeDasharray: "5 5"`
- `CartesianGrid`: color sutil (`t.grid`)
- `XAxis`: etiquetas de semana (ej: "Sem 1", "Sem 2")
- `YAxis`: sin axisLine ni tickLine
- `Tooltip`: fondo `ttBg`, borde `ttB`, radius 8, fontSize 11

#### DailyLoadChart

| Campo | Valor |
|-------|-------|
| **Nombre** | `DailyLoadChart` |
| **Tipo** | Client Component — Recharts |
| **Props** | `data: Array<{ day: string, load: number }>` (obligatoria) |
| **Estados** | Default único |
| **Tokens** | Card fondo: `card`. Card borde: `cardB`. Título: `t1` (14px, weight 600). Barras: `#f97316`. Grid: sutil. |
| **Responsive** | Height 180px desktop, 160px mobile. |
| **Contenido** | Título "Carga diaria" + BarChart con barras naranja (TSS por día) + tooltip |
| **Reutilizable** | No — específico del Dashboard |

**Configuración Recharts**:
- `BarChart` con datos de 7 días (L-D)
- `Bar`: `fill: #f97316`, `radius: [5, 5, 0, 0]`
- `XAxis`: días abreviados ("L", "M", "X", "J", "V", "S", "D")

#### AICoachCard

| Campo | Valor |
|-------|-------|
| **Nombre** | `AICoachCard` |
| **Tipo** | Server Component — renderiza texto recibido como prop |
| **Props** | `recommendation: string` (obligatoria), `tips?: { hydration?: string, sleep?: string, nutrition?: string }` (opcional) |
| **Estados** | Default único |
| **Tokens** | Fondo: `aiBg` (gradient naranja sutil). Borde: `aiB`. Badge "ENTRENADOR IA": gradient naranja, texto `#f97316` uppercase (12px, weight 700). Texto recomendación: `t2` (13px, line-height 1.6). Separador: `rgba(249,115,22,0.12)`. |
| **Responsive** | Sin diferencias significativas. Padding 20px desktop, 14px mobile. |
| **Contenido** | Badge con logo mini (Zap 16px) + "ENTRENADOR IA" + texto de recomendación + separador + 3 tips con icono |
| **Reutilizable** | Sí — patrón de tarjeta IA usado en Dashboard, Detalle de Actividad e Insights |

**Tips del coach**:

| Icono | Color | Label | Ejemplo |
|-------|-------|-------|---------|
| `Droplets` | `#3b82f6` (azul) | Hidratación | "2.5L mínimo" |
| `Moon` | `#8b5cf6` (violeta) | Sueño | "7.5h recomendadas" |
| `Sun` | `#eab308` (amarillo) | Nutrición | "+30g carbohidratos" |

#### RecentActivityItem

| Campo | Valor |
|-------|-------|
| **Nombre** | `RecentActivityItem` |
| **Tipo** | Client Component — necesita `onClick` para navegar a detalle |
| **Props** | `id: string` (obligatoria), `name: string` (obligatoria), `date: string` (obligatoria), `type: ActivityType` (obligatoria), `distance?: number` (opcional), `avgPower?: number` (opcional), `avgHR?: number` (opcional), `duration: number` (obligatoria, segundos) |
| **Estados** | Default. Hover: fondo cambia a `hover` (sutil). |
| **Tokens** | Card fondo: `card`. Card borde: `cardB`. Nombre: `t1` (14px, weight 600). Fecha: `t3` (11px). Métricas: `t2` (12px). Badge tipo: ver tabla de colores por tipo. |
| **Responsive** | Desktop: métricas en línea. Mobile: métricas en grid 2x2 compacto. |
| **Contenido** | Badge tipo + nombre + fecha + métricas resumidas (distancia, potencia, FC, duración) |
| **Reutilizable** | Sí — usado en Dashboard (4 items) y reutilizable en Lista de Actividades |

**Colores por tipo de actividad** (ref: DESIGN-SYSTEM.md §2.2):

| Tipo | Color | Fondo badge | Emoji |
|------|-------|-------------|-------|
| `intervals` | `#ef4444` | `rgba(239,68,68,0.1)` | 🔴 |
| `endurance` | `#22c55e` | `rgba(34,197,94,0.1)` | 🟢 |
| `recovery` | `#3b82f6` | `rgba(59,130,246,0.1)` | 🔵 |
| `tempo` | `#f97316` | `rgba(249,115,22,0.1)` | 🟠 |
| `rest` | `#64748b` | `rgba(100,116,139,0.1)` | ⚪ |

**Nota sobre activity_type**: La migration actual usa `ENUM ('outdoor', 'indoor', 'recovery')`. El DESIGN-SYSTEM usa `intervals`, `endurance`, `recovery`, `tempo`, `rest`. Se necesitará una migración futura para alinear estos tipos. En la spec funcional se documenta el diseño target.

#### RecentActivitiesSection

| Campo | Valor |
|-------|-------|
| **Nombre** | `RecentActivitiesSection` |
| **Tipo** | Server Component — obtiene datos, renderiza lista |
| **Props** | `activities: Activity[]` (obligatoria, máx 4 items) |
| **Estados** | Con datos: lista de 4 items + enlace "Ver todas". Sin datos: mensaje "Aún no tienes actividades registradas". |
| **Tokens** | Título: `t1` (18px, weight 700). Enlace "Ver todas": `acc` (13px, weight 500). |
| **Responsive** | Sin diferencias — items apilados verticalmente |
| **Contenido** | Título "Actividades recientes" + 4 RecentActivityItem + enlace "Ver todas →" que navega a `/activities` |
| **Reutilizable** | No — específico del Dashboard |

---

## 4. Jerarquía de Componentes

```
AppLayout (layout.tsx — Server Component)
├── Sidebar (Client) ♻️
│   ├── Logo (Zap + "Cycling Companion")
│   ├── NavItems ×5 (Dashboard, Actividades, Planificación, Insights, Perfil)
│   ├── ThemeToggle (Client) ♻️
│   └── UserInfo (nombre + email)
│
└── DashboardPage (page.tsx — Server Component)
    ├── DashboardHeader (Server)
    │   ├── Saludo personalizado (hora + nombre)
    │   └── Resumen de semana
    │
    ├── OverloadAlert (Server, condicional)
    │
    ├── KPICard ×4 ♻️ (grid 4 cols / 2x2 mobile)
    │   ├── KPI Distancia
    │   ├── KPI Tiempo
    │   ├── KPI Potencia
    │   └── KPI FC media
    │
    ├── PowerTrendChart (Client)
    │   └── Recharts AreaChart (4 semanas)
    │
    ├── DailyLoadChart (Client)
    │   └── Recharts BarChart (L-D)
    │
    ├── AICoachCard (Server) ♻️
    │   ├── Badge "ENTRENADOR IA"
    │   ├── Texto de recomendación
    │   └── Tips (hidratación, sueño, nutrición)
    │
    └── RecentActivitiesSection (Server)
        ├── RecentActivityItem ×4 ♻️
        └── Enlace "Ver todas →"
```

**Leyenda**: ♻️ = Componente reutilizable

---

## 5. Datos Necesarios

### Datos del Servidor

| Dato | Fuente | Cuándo |
|------|--------|--------|
| Perfil del usuario | `supabase.from('users').select('*')` | Al cargar la página |
| Actividades de las últimas 4 semanas | `supabase.from('activities').select('*').gte('date', startOf4WeeksAgo)` | Al cargar la página |
| Recomendación IA del día | API: `GET /api/v1/ai/daily-recommendation` (o caché) | Al cargar la página |

### Datos calculados (server-side)

| Dato | Cálculo | Componente consumidor |
|------|---------|----------------------|
| KPIs semanales | Agregaciones de actividades de la semana actual | KPICard ×4 |
| Tendencias | Comparación KPIs semana actual vs anterior (% cambio) | KPICard ×4 (badge) |
| Tendencia 4 semanas | AVG potencia y FC agrupados por semana | PowerTrendChart |
| Carga diaria | SUM(TSS) por día de la semana actual | DailyLoadChart |
| Carga semanal vs media | SUM(TSS) semana actual vs AVG(SUM(TSS)) últimas 4 semanas | OverloadAlert |
| Actividades recientes | Últimas 4 actividades ordenadas por fecha DESC | RecentActivitiesSection |
| Nº actividades semana | COUNT actividades de la semana actual | DashboardHeader |

### Contrato de datos

```typescript
interface DashboardData {
  user: {
    display_name: string;
    ftp: number | null;
    max_hr: number | null;
    goal: GoalType;
  };

  kpis: {
    distanceKm: number;
    durationSeconds: number;
    avgPower: number | null;
    avgHR: number | null;
    trends: {
      distance: { direction: 'up' | 'down'; percentage: number } | null;
      duration: { direction: 'up' | 'down'; percentage: number } | null;
      power: { direction: 'up' | 'down'; percentage: number } | null;
      hr: { direction: 'up' | 'down'; percentage: number } | null;
    };
  };

  weeklyTrend: Array<{
    week: string;     // "Sem 1", "Sem 2", etc.
    power: number;
    hr: number;
  }>;

  dailyLoad: Array<{
    day: string;      // "L", "M", "X", "J", "V", "S", "D"
    load: number;     // TSS del día
  }>;

  overload: {
    currentLoad: number;
    avgLoad: number;
    percentage: number;   // (currentLoad / avgLoad) * 100
  } | null;

  aiRecommendation: {
    text: string;
    tips: {
      hydration?: string;
      sleep?: string;
      nutrition?: string;
    };
  } | null;

  recentActivities: Array<{
    id: string;
    name: string;
    date: string;
    type: ActivityType;
    distance_km: number | null;
    duration_seconds: number;
    avg_power_watts: number | null;
    avg_hr_bpm: number | null;
  }>;

  weekNumber: number;
  activityCount: number;
}
```

---

## 6. Flujos de Interacción

### Flujo 1: Carga inicial del Dashboard (flujo feliz)

1. Usuario autenticado navega a `/`.
2. Server Component verifica auth + perfil (ya implementado en placeholder).
3. Obtiene actividades de las últimas 4 semanas de Supabase.
4. Calcula KPIs, tendencias, carga diaria (server-side).
5. Obtiene recomendación IA del día (caché 24h si existe, o genera nueva).
6. Renderiza Dashboard con todos los datos.

### Flujo 2: Dashboard sin actividades (usuario nuevo)

1. Usuario acaba de completar el onboarding, no tiene actividades.
2. KPIs muestran "0" o "—" sin badges de tendencia.
3. Gráficas muestran estado vacío (eje X con días, sin barras/líneas).
4. No se muestra OverloadAlert.
5. AICoachCard muestra mensaje genérico: "Sube tu primera actividad para empezar a recibir recomendaciones personalizadas."
6. RecentActivitiesSection muestra: "Aún no tienes actividades registradas."

### Flujo 3: Ver alerta de sobrecarga

1. El cálculo server-side detecta TSS semanal > 1.2x media.
2. Se renderiza OverloadAlert (amarillo si 1.2x-1.5x, rojo si > 1.5x).
3. El banner incluye el porcentaje exacto: "+35% por encima de tu media".
4. El usuario puede navegar a `/plan` para ajustar su plan.

### Flujo 4: Ver actividad reciente

1. Usuario ve la sección "Actividades recientes" con 4 items.
2. Hace clic en un item.
3. Navega a `/activities/:id` (detalle de la actividad).

### Flujo 5: Ver todas las actividades

1. Usuario ve el enlace "Ver todas →" al final de actividades recientes.
2. Hace clic.
3. Navega a `/activities` (lista completa).

### Flujo 6: Cambio de tema

1. En el sidebar, el usuario hace clic en el ThemeToggle.
2. El tema cambia de dark a light (o viceversa).
3. Todos los componentes se actualizan con los nuevos tokens.
4. La preferencia se persiste en localStorage (vía `next-themes`).

---

## 7. Tokens de Tema Aplicables

### Dashboard

| Elemento | Token | Dark | Light |
|----------|-------|------|-------|
| Fondo página | `bg` | `#0c1320` | `#f8f9fb` |
| Card fondo | `card` | `rgba(255,255,255,0.02)` | `#ffffff` |
| Card borde | `cardB` | `rgba(255,255,255,0.06)` | `#e2e8f0` |
| Saludo (h1) | `t1` | `#f1f5f9` | `#0f172a` |
| Resumen semana | `t2` | `#94a3b8` | `#475569` |
| KPI valor | `t1` | `#f1f5f9` | `#0f172a` |
| KPI unidad | `t2` | `#94a3b8` | `#475569` |
| KPI label | `t3` | `#64748b` | `#64748b` |
| Trend positiva | `#22c55e` | `#22c55e` | `#22c55e` |
| Trend negativa | `#ef4444` | `#ef4444` | `#ef4444` |
| AI Coach fondo | `aiBg` | `linear-gradient(135deg, rgba(249,115,22,0.08), rgba(234,88,12,0.04))` | `linear-gradient(135deg, rgba(249,115,22,0.06), rgba(234,88,12,0.02))` |
| AI Coach borde | `aiB` | `rgba(249,115,22,0.18)` | `rgba(249,115,22,0.2)` |
| Alerta amarilla fondo | — | `rgba(234,179,8,0.1)` | `rgba(234,179,8,0.06)` |
| Alerta amarilla borde | — | `rgba(234,179,8,0.3)` | `rgba(234,179,8,0.4)` |
| Alerta roja fondo | — | `rgba(239,68,68,0.1)` | `rgba(239,68,68,0.06)` |
| Alerta roja borde | — | `rgba(239,68,68,0.3)` | `rgba(239,68,68,0.4)` |

### Sidebar

| Elemento | Token | Dark | Light |
|----------|-------|------|-------|
| Fondo | `sidebar` | `linear-gradient(180deg, #0f1923, #162032)` | `linear-gradient(180deg, #ffffff, #f1f5f9)` |
| Borde derecho | `cardB` | `rgba(255,255,255,0.06)` | `#e2e8f0` |
| Nav item activo fondo | `actBg` | `rgba(249,115,22,0.12)` | `rgba(249,115,22,0.08)` |
| Nav item activo texto | `acc` | `#f97316` | `#ea580c` |
| Nav item inactivo texto | `t2` | `#94a3b8` | `#475569` |
| Nav item icono inactivo | `t3` | `#64748b` | `#64748b` |
| Hover fondo | — | `rgba(255,255,255,0.04)` | `rgba(0,0,0,0.04)` |

### Gráficas (Recharts)

| Elemento | Token | Dark | Light |
|----------|-------|------|-------|
| Grid | `grid` | `rgba(255,255,255,0.04)` | `#e2e8f0` |
| Ejes texto | `t3` | `#64748b` | `#64748b` |
| Tooltip fondo | `ttBg` | `rgba(15,25,35,0.95)` | `#ffffff` |
| Tooltip borde | `ttB` | `rgba(255,255,255,0.1)` | `#e2e8f0` |
| Área potencia | — | `#f97316` | `#f97316` |
| Línea FC | — | `#ef4444` | `#ef4444` |
| Barras carga | — | `#f97316` | `#ea580c` |

---

## 8. Componentes Reutilizables

| Componente | Usado en Dashboard | Reutilizable en | shadcn/ui base | Crear custom |
|------------|-------------------|-----------------|----------------|--------------|
| **Sidebar** | Layout app | Todas las pantallas (app) | No — custom | Sí |
| **ThemeToggle** | Sidebar | Ya existe del auth flow | No — custom | Ya existe ♻️ |
| **KPICard** | Dashboard (4 cards) | Detalle actividad | `Card` de shadcn posible base | Sí — custom |
| **AICoachCard** | Dashboard | Detalle actividad, Insights | No — custom | Sí — patrón compartido con AICoachWelcome |
| **RecentActivityItem** | Dashboard (4 items) | Lista de actividades | No — custom | Sí |
| **PowerTrendChart** | Dashboard | — | No — Recharts | Sí |
| **DailyLoadChart** | Dashboard | — | No — Recharts | Sí |
| **OverloadAlert** | Dashboard | — | No — custom | Sí |

---

## 9. Transformaciones JSX Necesarias

### Sidebar — Inline Styles → Tailwind

| Patrón mockup | Transformación Tailwind |
|---------------|------------------------|
| `width: 220` | `w-[220px]` |
| `background: linear-gradient(180deg, ...)` | CSS custom property `--sidebar-bg` |
| `borderRight: "1px solid ..."` | `border-r border-[var(--card-border)]` |
| `padding: "24px 0"` | `py-6` |
| `gap: 4` | `gap-1` |

### KPI Cards

| Patrón mockup | Transformación Tailwind |
|---------------|------------------------|
| `display: "grid", gridTemplateColumns: "repeat(4, 1fr)"` | `grid grid-cols-2 md:grid-cols-4` |
| `padding: mob ? 12 : 18` | `p-3 md:p-[18px]` |
| `borderRadius: 14` | `rounded-[14px]` |
| `fontSize: mob ? 20 : 26` | `text-xl md:text-[26px]` |
| `width: 40, height: 40, borderRadius: 10` (icono) | `w-10 h-10 rounded-[10px]` |

### Hook `useMob()` → Tailwind Breakpoints

Aplicable a todo el Dashboard:
- Grid responsive: `grid-cols-2 md:grid-cols-4`
- Padding: `p-4 md:p-8`
- Font sizes: `text-[22px] md:text-[26px]`
- Sidebar: `hidden md:flex` (desktop) + overlay mobile

### Theme Context → Tailwind `dark:` + CSS Variables

Los tokens de tema que no mapean a clases Tailwind estándar (gradients, rgba complejos) usan CSS custom properties definidas en `globals.css`:

```css
:root {
  --surface-bg: #f8f9fb;
  --card-bg: #ffffff;
  --card-border: #e2e8f0;
  --sidebar-bg: linear-gradient(180deg, #ffffff, #f1f5f9);
  --ai-bg: linear-gradient(135deg, rgba(249,115,22,0.06), rgba(234,88,12,0.02));
  --ai-border: rgba(249,115,22,0.2);
  /* ... */
}

.dark {
  --surface-bg: #0c1320;
  --card-bg: rgba(255,255,255,0.02);
  --card-border: rgba(255,255,255,0.06);
  --sidebar-bg: linear-gradient(180deg, #0f1923, #162032);
  --ai-bg: linear-gradient(135deg, rgba(249,115,22,0.08), rgba(234,88,12,0.04));
  --ai-border: rgba(249,115,22,0.18);
  /* ... */
}
```

---

## 10. Dependencias Externas

### Paquetes npm

| Paquete | Uso | Ya instalado |
|---------|-----|-------------|
| `lucide-react` | Iconos: Activity, Clock, Zap, Heart, BarChart3, Calendar, TrendingUp, User, AlertTriangle, Menu, X, Droplets, Moon, Sun, ChevronRight | Sí |
| `recharts` | AreaChart, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, Bar, ResponsiveContainer | Por instalar |
| `next-themes` | Toggle de tema en Sidebar | Sí |
| `@supabase/ssr` | Queries a Supabase (server-side) | Sí |

### Componentes shadcn/ui a instalar

| Componente | Uso |
|------------|-----|
| `card` | Posible base para KPICard, AICoachCard (evaluar) |
| `tooltip` | Posible uso en KPIs o gráficas |

### Integraciones

| Servicio | Uso | Estado |
|----------|-----|--------|
| Supabase DB | Queries de actividades + perfil usuario | ✅ Tablas creadas |
| Claude API (vía Fastify) | Recomendación diaria | ❌ Por implementar |
| Supabase Auth | Verificación de sesión | ✅ Implementado |

---

## Apéndice: Datos de Navegación del Sidebar (Constante Reutilizable)

```typescript
import { Activity, BarChart3, Calendar, TrendingUp, User } from 'lucide-react';

export const NAV_ITEMS = [
  { icon: Activity, label: 'Dashboard', href: '/' },
  { icon: BarChart3, label: 'Actividades', href: '/activities' },
  { icon: Calendar, label: 'Planificación', href: '/plan' },
  { icon: TrendingUp, label: 'Insights', href: '/insights' },
  { icon: User, label: 'Perfil', href: '/profile' },
] as const;
```

---

## Apéndice: Constantes de Tipos de Actividad (Reutilizable)

```typescript
export const ACTIVITY_TYPES = {
  intervals:  { label: 'Intervalos',    color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   emoji: '🔴' },
  endurance:  { label: 'Resistencia',   color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   emoji: '🟢' },
  recovery:   { label: 'Recuperación',  color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  emoji: '🔵' },
  tempo:      { label: 'Tempo',         color: '#f97316', bg: 'rgba(249,115,22,0.1)',  emoji: '🟠' },
  rest:       { label: 'Descanso',      color: '#64748b', bg: 'rgba(100,116,139,0.1)', emoji: '⚪' },
} as const;
```
