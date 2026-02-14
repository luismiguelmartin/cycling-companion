# L1 — Spec Funcional: Planificación Semanal

> **Fuente**: `docs/design/cycling-companion-full-app.jsx`
> **Requisito PRD**: F06 — Planificación semanal (P1)
> **Fecha**: 2026-02-14

---

## 1. Resumen de la Pantalla

La pantalla de Planificación Semanal permite al usuario visualizar y gestionar su plan de entrenamiento generado por la IA. Muestra 7 días con tipo de sesión, intensidad, duración, y permite ver el detalle de cada día con tips de nutrición y descanso.

| Pantalla | Componente JSX | Propósito |
|----------|---------------|-----------|
| **Planificación Semanal** | `PlanPage` | Visualizar plan de 7 días generado por IA, con barra de carga semanal, detalle por día, tips de nutrición y descanso. |

**Requisito PRD asociado**: F06 — Plan semanal generado por IA con 7 días, tipo de sesión, intensidad, duración, descripción, tips de nutrición y descanso. El usuario puede recalcular el plan.

---

## 2. Ruta y Navegación

### Rutas propuestas

| Pantalla | Ruta | Route Group |
|----------|------|-------------|
| Planificación Semanal | `/plan` | `(app)` |

### Flujo de navegación

```
Sidebar "Planificación" → /plan
                            │
                    ┌───────┴────────┐
                    │                │
              Con plan          Sin plan
                    │                │
         Visualizar plan     "No hay plan generado"
                    │          + botón "Generar plan"
                    │
              ┌─────┼──────┐
              │     │      │
      Seleccionar  Navegar  Recalcular
        día      semana     plan
              │
     Ver detalle + tips
```

### Condiciones de acceso

| Ruta | Auth requerida | Condición adicional |
|------|---------------|---------------------|
| `/plan` | Sí | Si no completó onboarding → redirect a `/onboarding` |

---

## 3. Componentes Identificados

### 3.1 PlanHeader

| Campo | Valor |
|-------|-------|
| **Nombre** | `PlanHeader` |
| **Tipo** | Client Component — navegación entre semanas + botón recalcular |
| **Props** | `weekRange: string` (obligatoria), `onPrevWeek: () => void` (obligatoria), `onNextWeek: () => void` (obligatoria), `onRecalculate: () => void` (obligatoria), `isRecalculating: boolean` (obligatoria) |
| **Estados** | Default: navegación habilitada. Recalculando: botón muestra spinner. |
| **Tokens** | Título: `t1` (26px desktop / 22px mobile, weight 700). Rango fechas: `t2` (12px). Flechas: `t3` (14px). |
| **Responsive** | Desktop: título y botón en misma línea. Mobile: título arriba, botón abajo. |
| **Contenido** | Título "Plan semanal" + navegación semana (← rango →) + botón "Recalcular" (gradient naranja) |
| **Reutilizable** | No — específico de la pantalla Plan |

**Navegación de semana**:

| Elemento | Icono | Acción |
|----------|-------|--------|
| Anterior | `ChevronLeft` (14px, `t3`) | Navegar a semana anterior |
| Rango | — | Texto "10 — 16 feb 2026" en `t2` (12px) |
| Siguiente | `ChevronRight` (14px, `t3`) | Navegar a semana siguiente |

**Botón Recalcular**:

| Estado | Contenido | Estilo |
|--------|-----------|--------|
| Default | Icono `RefreshCw` (13px) + "Recalcular" | Gradient naranja, texto blanco, 12px weight 600, padding `7px 14px`, radius 10 |
| Recalculando | Spinner + "Recalculando..." | Mismo estilo, opacidad reducida, cursor disabled |

### 3.2 WeeklyLoadBar

| Campo | Valor |
|-------|-------|
| **Nombre** | `WeeklyLoadBar` |
| **Tipo** | Server Component — solo renderiza datos |
| **Props** | `currentTSS: number` (obligatoria), `avgTSS: number` (obligatoria), `maxTSS: number` (obligatoria) |
| **Estados** | Default único. Barra de progreso con gradient. |
| **Tokens** | Card fondo: `card`. Card borde: `cardB`. Label: `t1` (12px, weight 600). TSS valor: color según nivel (verde si < 100%, amarillo si 100-120%, naranja si > 120%). Barra fondo: `t4` al 20%. Escala: `t4` (10px). |
| **Responsive** | Sin diferencias — barra de ancho completo. Padding `12px 16px`. |
| **Contenido** | Label "Carga semanal" + valor TSS con icono alerta + barra degradada + escala (0, Media, Max) |
| **Reutilizable** | No — específico de la pantalla Plan |

**Barra de progreso**:
- Altura: 7px, borderRadius 4px
- Fondo: `t4` al 20%
- Relleno: gradient `linear-gradient(90deg, #22c55e, #eab308, #f97316)`
- Anchura: porcentaje relativo al max (`currentTSS / maxTSS * 100%`)

**Colores del valor TSS**:

| Condición | Color | Icono |
|-----------|-------|-------|
| TSS < avgTSS | `#22c55e` (verde) | — |
| TSS entre avgTSS y avgTSS*1.2 | `#eab308` (amarillo) | ⚠️ |
| TSS > avgTSS*1.2 | `#ef4444` (rojo) | ⚠️ |

**Escala inferior**:

| Posición | Texto | Alineación |
|----------|-------|------------|
| Izquierda | "0" | left |
| Centro | "Media: {avgTSS}" | center |
| Derecha | "{maxTSS}" | right |

### 3.3 DayGrid

| Campo | Valor |
|-------|-------|
| **Nombre** | `DayGrid` |
| **Tipo** | Client Component — gestiona selección del día |
| **Props** | `days: PlanDay[]` (obligatoria), `selectedIndex: number` (obligatoria), `onSelect: (index: number) => void` (obligatoria) |
| **Estados** | Un día seleccionado (fondo del tipo), los demás normales. Indicador "HOY" en el día actual. Días completados con opacidad reducida. |
| **Tokens** | Card fondo: `card`. Card borde: `cardB`. Día nombre: `t1` (12px, weight 700). Fecha: `t3` (10px). Título sesión: `t1` (12-13px, weight 600). Badge intensidad: fondo `{intensityColor}15`, texto `{intensityColor}`. Badge duración: fondo `t4` al 15%, texto `t3`. |
| **Responsive** | Desktop: grid 7 columnas. Mobile: grid 2 columnas. Altura mínima: 120px desktop, 90px mobile. |
| **Contenido** | 7 cards de día con: indicador HOY, nombre día, fecha, emoji tipo, título sesión, badges intensidad + duración, estado completado |
| **Reutilizable** | No — específico de la pantalla Plan |

**Card de día**:

```
┌──────────────────────┐
│                 HOY  │  ← Badge condicional (solo día actual)
│ Vie        🟠        │  ← Nombre día + emoji tipo
│ 14 feb               │  ← Fecha
│                      │
│ Tempo sostenido      │  ← Título sesión
│                      │
│ [media-alta] [1h15]  │  ← Badges intensidad + duración
│                      │
│ ✓ 195W               │  ← Estado completado (solo si done=true)
└──────────────────────┘
```

**Estados de la card**:

| Estado | Fondo | Borde | Opacidad |
|--------|-------|-------|----------|
| Default | `card` | `cardB` | 1 |
| Seleccionado | `{typeColor}` al 10% | `{typeColor}` al 40% | 1 |
| Hoy (no seleccionado) | `card` | `acc` al 30% | 1 |
| Completado | `card` | `cardB` | 0.7 |
| Completado + seleccionado | `{typeColor}` al 10% | `{typeColor}` al 40% | 0.7 |

**Badge "HOY"**:
- Posición: absoluta, top -1px, right 12px
- Fondo: `#f97316`
- Texto: blanco, 9px, weight 700
- Padding: `1px 6px`
- BorderRadius: `0 0 5px 5px`

**Estado completado**:
- Con potencia real: "✓ {pw}W" en verde `#22c55e`, 11px
- Descanso completado: "✓ Cumplido" en `t3`, 11px
- No completado: no se muestra nada

**Colores por tipo de entrenamiento** (ref: DESIGN-SYSTEM.md §2.2):

| Tipo | Color | Emoji |
|------|-------|-------|
| `intervals` | `#ef4444` | 🔴 |
| `endurance` | `#22c55e` | 🟢 |
| `recovery` | `#3b82f6` | 🔵 |
| `tempo` | `#f97316` | 🟠 |
| `rest` | `#64748b` | ⚪ |

**Colores de intensidad**:

| Nivel | Color |
|-------|-------|
| alta | `#ef4444` |
| media-alta | `#f97316` |
| media | `#eab308` |
| baja | `#22c55e` |
| — (descanso) | `#64748b` |

### 3.4 DayDetail

| Campo | Valor |
|-------|-------|
| **Nombre** | `DayDetail` |
| **Tipo** | Server Component — solo renderiza datos del día seleccionado |
| **Props** | `day: PlanDay` (obligatoria) |
| **Estados** | Default único |
| **Tokens** | Card fondo: `card`. Card borde: `{typeColor}` al 30%. Emoji tipo: 20px. Título sesión: `t1` (16px, weight 700). Fecha: `t3` (12px). Descripción: `t2` (13px, line-height 1.6). |
| **Responsive** | Desktop: ocupa la mitad izquierda del grid 2 cols. Mobile: ancho completo, apilado. |
| **Contenido** | Emoji tipo + título sesión + fecha + descripción del entrenamiento + duración |
| **Reutilizable** | No — específico de la pantalla Plan |

**Icono duración**:
- Icono `Clock` (12px) en `#8b5cf6` + texto duración en `t2` (12px)
- Solo se muestra si `dur !== "—"` (no se muestra en días de descanso)

### 3.5 NutritionCard

| Campo | Valor |
|-------|-------|
| **Nombre** | `NutritionCard` |
| **Tipo** | Server Component — solo renderiza texto |
| **Props** | `text: string` (obligatoria) |
| **Estados** | Default único |
| **Tokens** | Fondo: `rgba(234,179,8,0.05)`. Borde: `1px solid rgba(234,179,8,0.15)`. Radius: 12px. Padding: 14px. Título: `#eab308` (13px, weight 600). Texto: `t2` (12px, line-height 1.6). |
| **Responsive** | Sin diferencias significativas. |
| **Contenido** | Icono `Sun` (14px, `#eab308`) + "Nutrición" + texto del tip |
| **Reutilizable** | Sí — patrón de tip card reutilizable (mismo patrón que RestCard con colores diferentes) |

### 3.6 RestCard

| Campo | Valor |
|-------|-------|
| **Nombre** | `RestCard` |
| **Tipo** | Server Component — solo renderiza texto |
| **Props** | `text: string` (obligatoria) |
| **Estados** | Default único |
| **Tokens** | Fondo: `rgba(139,92,246,0.05)`. Borde: `1px solid rgba(139,92,246,0.15)`. Radius: 12px. Padding: 14px. Título: `#8b5cf6` (13px, weight 600). Texto: `t2` (12px, line-height 1.6). |
| **Responsive** | Sin diferencias significativas. |
| **Contenido** | Icono `Moon` (14px, `#8b5cf6`) + "Descanso" + texto del tip |
| **Reutilizable** | Sí — patrón de tip card reutilizable |

---

## 4. Jerarquía de Componentes

```
AppLayout (layout.tsx — Server Component)
├── Sidebar (Client) ♻️
│
└── PlanPage (page.tsx — Server Component)
    ├── PlanHeader (Client)
    │   ├── Título "Plan semanal"
    │   ├── Navegación semana (← rango →)
    │   └── Botón "Recalcular" (RefreshCw)
    │
    ├── WeeklyLoadBar (Server)
    │   ├── Label "Carga semanal" + valor TSS
    │   ├── Barra degradada (verde→amarillo→naranja)
    │   └── Escala (0, Media, Max)
    │
    ├── PlanContent (Client — gestiona selección de día)
    │   ├── DayGrid (Client)
    │   │   ├── DayCard ×7
    │   │   │   ├── Badge "HOY" (condicional)
    │   │   │   ├── Nombre día + emoji tipo
    │   │   │   ├── Título sesión
    │   │   │   ├── Badges intensidad + duración
    │   │   │   └── Estado completado (condicional)
    │   │   │
    │   │   └── [responsive: 7 cols desktop, 2 cols mobile]
    │   │
    │   └── DetailSection (grid 2 cols desktop, stacked mobile)
    │       ├── DayDetail
    │       │   ├── Emoji + título + fecha
    │       │   ├── Descripción
    │       │   └── Duración (Clock icon)
    │       │
    │       └── TipsColumn (flex column, gap 10)
    │           ├── NutritionCard (Sun icon, amarillo)
    │           └── RestCard (Moon icon, violeta)
    │
    └── [Estado vacío: sin plan generado]
```

**Leyenda**: ♻️ = Componente reutilizable

---

## 5. Datos Necesarios

### Datos del Servidor

| Dato | Fuente | Cuándo |
|------|--------|--------|
| Plan semanal activo | `supabase.from('weekly_plans').select('*').eq('user_id', user.id).order('week_start', { ascending: false }).limit(1)` | Al cargar `/plan` |
| Actividades de la semana | `supabase.from('activities').select('date, avg_power_watts, tss')` filtradas por rango de la semana | Al cargar `/plan` |
| Perfil del usuario | `supabase.from('users').select('ftp, goal')` | Al cargar `/plan` |

### Datos del Cliente (Estado Local)

| Dato | Tipo | Componente | Valor inicial |
|------|------|-----------|---------------|
| `selectedDay` | `number` | PlanContent | Índice del día actual (0-6), o 0 si no aplica |
| `weekOffset` | `number` | PlanHeader | `0` (semana actual) |
| `isRecalculating` | `boolean` | PlanHeader | `false` |

### Contrato de datos

```typescript
// Estructura del plan semanal (campo plan_data en weekly_plans)
interface WeeklyPlan {
  id: string;
  user_id: string;
  week_start: string;        // ISO date (lunes)
  week_end: string;           // ISO date (domingo)
  plan_data: PlanDay[];       // 7 días
  ai_rationale: string;       // Explicación de la IA
  created_at: string;
  updated_at: string;
}

interface PlanDay {
  day: string;                // "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"
  date: string;               // "10" (día del mes)
  type: ActivityType;         // intervals | endurance | recovery | tempo | rest
  title: string;              // "Intervalos 4x8'"
  intensity: IntensityLevel;  // "alta" | "media-alta" | "media" | "baja" | "—"
  duration: string;           // "1h30" | "—"
  description: string;        // "4 series 8' Z4, 4' rec"
  nutrition: string;          // "80g carbs antes. Gel mitad."
  rest: string;               // "Estiramientos 15min. Foam roller."
  done: boolean;              // Si la sesión fue completada
  actual_power: number | null; // Potencia media real (si done=true)
}

type IntensityLevel = 'alta' | 'media-alta' | 'media' | 'baja' | '—';
```

**Mapeo a tabla `weekly_plans`**:

| Campo del plan | Campo en DB | Tipo DB | Notas |
|---------------|-------------|---------|-------|
| Días del plan | `plan_data` | `JSONB NOT NULL` | Array de 7 PlanDay |
| Explicación IA | `ai_rationale` | `TEXT` | Justificación de la IA |
| Inicio semana | `week_start` | `DATE NOT NULL` | Siempre lunes |
| Fin semana | `week_end` | `DATE NOT NULL` | Siempre domingo |

**Cálculo de "done"**: Un día se marca como completado si existe una actividad en la tabla `activities` con fecha coincidente con el día del plan. La potencia real (`actual_power`) se obtiene de `avg_power_watts` de esa actividad.

---

## 6. Flujos de Interacción

### Flujo 1: Carga del plan semanal (flujo feliz)

1. Usuario navega a `/plan` desde el Sidebar.
2. Server Component obtiene el plan de la semana actual de Supabase.
3. Cruza con actividades reales para marcar días completados.
4. Calcula TSS total de la semana para la barra de carga.
5. Renderiza con el día actual pre-seleccionado (o viernes si es el mockup).
6. El usuario ve el grid de 7 días + detalle del día seleccionado.

### Flujo 2: Seleccionar un día

1. Usuario ve el grid de 7 días, con uno seleccionado (fondo coloreado).
2. Hace clic en otro día (ej: "Sáb - Ruta larga Z2").
3. El fondo del día cambia al color del tipo (verde para endurance).
4. El detalle inferior se actualiza: descripción, duración, tips de nutrición y descanso.
5. La selección anterior se deselecciona.

### Flujo 3: Navegar entre semanas

1. Usuario está viendo la semana del 10-16 feb.
2. Clic en `ChevronLeft` → carga semana 3-9 feb.
3. El rango de fechas se actualiza.
4. Si hay plan para esa semana, se muestra. Si no, estado vacío.
5. Clic en `ChevronRight` → vuelve a semana actual.

### Flujo 4: Recalcular plan (flujo feliz)

1. Usuario clic en "Recalcular" (botón gradient naranja).
2. Botón cambia a "Recalculando..." con spinner.
3. Se hace POST a `/api/v1/ai/weekly-plan` con contexto del usuario.
4. La IA genera un nuevo plan de 7 días basado en: perfil, objetivo, últimas actividades, carga acumulada.
5. El nuevo plan reemplaza al anterior en `weekly_plans`.
6. La pantalla se actualiza con el nuevo plan.
7. Toast: "Plan actualizado".

### Flujo 5: Plan sin datos (usuario nuevo)

1. Usuario nuevo navega a `/plan`.
2. No existe registro en `weekly_plans` para la semana actual.
3. Se muestra estado vacío: "No hay plan generado para esta semana."
4. Botón prominente: "Generar mi primer plan" (gradient naranja).
5. Al hacer clic, se comporta como Flujo 4.

### Flujo 6: Día de descanso

1. Usuario selecciona el jueves (tipo: `rest`).
2. DayDetail muestra: "Descanso total".
3. Duración muestra "—" (sin icono Clock).
4. NutritionCard muestra tips de descanso (ej: "No recortar calorías.").
5. RestCard muestra tips de recuperación (ej: "Contraste frío/calor.").

### Flujo 7: Error al recalcular

1. Usuario clic en "Recalcular".
2. La llamada a la API falla (timeout, error de red, etc.).
3. El botón vuelve al estado default.
4. Toast de error: "No se pudo recalcular el plan. Inténtalo de nuevo."
5. El plan anterior se mantiene visible.

---

## 7. Tokens de Tema Aplicables

### Planificación Semanal

| Elemento | Token | Dark | Light |
|----------|-------|------|-------|
| Fondo página | `bg` | `#0c1320` | `#f8f9fb` |
| Card fondo | `card` | `rgba(255,255,255,0.02)` | `#ffffff` |
| Card borde | `cardB` | `rgba(255,255,255,0.06)` | `#e2e8f0` |
| Título (h1) | `t1` | `#f1f5f9` | `#0f172a` |
| Rango fechas | `t2` | `#94a3b8` | `#475569` |
| Fecha día | `t3` | `#64748b` | `#64748b` |
| Flechas nav | `t3` | `#64748b` | `#64748b` |
| Nombre día | `t1` | `#f1f5f9` | `#0f172a` |
| Título sesión | `t1` | `#f1f5f9` | `#0f172a` |
| Descripción | `t2` | `#94a3b8` | `#475569` |
| Badge duración fondo | `t4` al 15% | `rgba(71,85,105,0.15)` | `rgba(148,163,184,0.15)` |
| Badge duración texto | `t3` | `#64748b` | `#64748b` |
| Barra carga fondo | `t4` al 20% | `rgba(71,85,105,0.2)` | `rgba(148,163,184,0.2)` |
| Escala barra | `t4` | `#475569` | `#94a3b8` |
| Day card hover | `hover` | `rgba(255,255,255,0.03)` | `#f8fafc` |
| Nutrición card fondo | — | `rgba(234,179,8,0.05)` | `rgba(234,179,8,0.05)` |
| Nutrición card borde | — | `rgba(234,179,8,0.15)` | `rgba(234,179,8,0.15)` |
| Nutrición título | — | `#eab308` | `#eab308` |
| Descanso card fondo | — | `rgba(139,92,246,0.05)` | `rgba(139,92,246,0.05)` |
| Descanso card borde | — | `rgba(139,92,246,0.15)` | `rgba(139,92,246,0.15)` |
| Descanso título | — | `#8b5cf6` | `#8b5cf6` |
| Badge HOY fondo | — | `#f97316` | `#ea580c` |
| Badge HOY texto | — | `#ffffff` | `#ffffff` |
| Completado (potencia) | — | `#22c55e` | `#22c55e` |

---

## 8. Componentes Reutilizables

| Componente | Usado en Plan | Reutilizado de | shadcn/ui base | Crear custom |
|------------|--------------|----------------|----------------|--------------|
| **Sidebar** | Layout | Dashboard (compartido) | No — custom | Ya existe ♻️ |
| **ThemeToggle** | Sidebar | Auth flow (ya existe) | No — custom | Ya existe ♻️ |
| **NutritionCard** | Detalle día | Nuevo | No — custom | Sí |
| **RestCard** | Detalle día | Nuevo | No — custom | Sí |
| **WeeklyLoadBar** | Encabezado | Nuevo | No — custom | Sí |
| **DayGrid** | Grid de días | Nuevo | No — custom | Sí |
| **DayDetail** | Detalle del día | Nuevo | No — custom | Sí |

**Nota**: NutritionCard y RestCard comparten el mismo patrón visual (icono + título + texto en card coloreada). Se podría crear un componente base `TipCard` con props de color, icono y título, y derivar ambos. Para el MVP: componentes separados por simplicidad.

---

## 9. Transformaciones JSX Necesarias

### Grid de días → Tailwind responsive

```jsx
// ❌ Mockup (inline)
<div style={{
  display: "grid",
  gridTemplateColumns: mob ? "repeat(2,1fr)" : "repeat(7,1fr)",
  gap: 8
}}>

// ✅ Proyecto (Tailwind)
<div className="grid grid-cols-2 md:grid-cols-7 gap-2">
```

### Day card con selección

```jsx
// ❌ Mockup (inline)
<div style={{
  background: sel2 ? ds.bg : t.card,
  border: `1px solid ${sel2 ? `${ds.c}40` : today ? `${t.acc}30` : t.cardB}`,
  opacity: d.done ? 0.7 : 1,
}}>

// ✅ Proyecto (Tailwind + clases dinámicas)
<div className={cn(
  "rounded-xl p-3 cursor-pointer relative min-h-[120px]",
  isSelected ? `bg-[${typeColor}]/10 border border-[${typeColor}]/40` :
  isToday ? "bg-[var(--card-bg)] border border-orange-500/30" :
  "bg-[var(--card-bg)] border border-[var(--card-border)]",
  isDone && "opacity-70"
)}>
```

### Badge HOY

```jsx
// ❌ Mockup (inline)
<div style={{
  position: "absolute", top: -1, right: 12,
  background: "#f97316", color: "white",
  fontSize: 9, fontWeight: 700,
  padding: "1px 6px", borderRadius: "0 0 5px 5px"
}}>HOY</div>

// ✅ Proyecto (Tailwind)
<div className="absolute -top-px right-3 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-px rounded-b-[5px]">
  HOY
</div>
```

### Barra de carga degradada

```jsx
// ❌ Mockup (inline)
<div style={{
  height: 7, borderRadius: 4,
  width: "78%",
  background: "linear-gradient(90deg,#22c55e,#eab308,#f97316)"
}} />

// ✅ Proyecto (Tailwind + style inline para width dinámico)
<div
  className="h-[7px] rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-orange-500"
  style={{ width: `${percentage}%` }}
/>
```

### Tip cards

```jsx
// ❌ Mockup (inline)
<div style={{
  background: "rgba(234,179,8,0.05)",
  border: "1px solid rgba(234,179,8,0.15)",
  borderRadius: 12, padding: 14
}}>

// ✅ Proyecto (Tailwind)
<div className="bg-yellow-500/5 border border-yellow-500/15 rounded-xl p-3.5">
```

---

## 10. Dependencias Externas

### Paquetes npm

| Paquete | Uso | Ya instalado |
|---------|-----|-------------|
| `lucide-react` | Iconos: ChevronLeft, ChevronRight, RefreshCw, Clock, Sun, Moon | Sí |
| `next-themes` | Toggle de tema en Sidebar | Sí |
| `@supabase/ssr` | Queries a Supabase (server-side) | Sí |

### Componentes shadcn/ui a instalar

Ninguno nuevo para esta pantalla.

### Integraciones

| Servicio | Uso | Estado |
|----------|-----|--------|
| Supabase DB (tabla `weekly_plans`) | Leer plan semanal | ❌ Tabla por crear |
| Supabase DB (tabla `activities`) | Cruzar con actividades reales | ✅ Tabla creada |
| Fastify API (POST /api/v1/ai/weekly-plan) | Generar/recalcular plan | ❌ Por implementar |
| Claude API | Generación IA del plan | ❌ Por implementar |

---

## Apéndice: Datos Mock del Plan Semanal

```typescript
export const MOCK_PLAN: PlanDay[] = [
  { day: "Lun", date: "10", type: "intervals", title: "Intervalos 4x8'", intensity: "alta", duration: "1h30", description: "4 series 8' Z4, 4' rec", nutrition: "80g carbs antes. Gel mitad.", rest: "Estiramientos 15min. Foam roller.", done: true, actual_power: 205 },
  { day: "Mar", date: "11", type: "recovery", title: "Recuperación activa", intensity: "baja", duration: "1h", description: "Z1-Z2, cadencia >85rpm", nutrition: "2L extra. Fruta post.", rest: "Mín 8h sueño.", done: true, actual_power: 132 },
  { day: "Mié", date: "12", type: "endurance", title: "Resistencia Z2", intensity: "media", duration: "2h", description: "Z2 constante", nutrition: "2 bidones. Barrita 1h.", rest: "Estiramientos. Cena proteínas.", done: true, actual_power: 168 },
  { day: "Jue", date: "13", type: "rest", title: "Descanso", intensity: "—", duration: "—", description: "Descanso total", nutrition: "No recortar calorías.", rest: "Contraste frío/calor.", done: true, actual_power: null },
  { day: "Vie", date: "14", type: "tempo", title: "Tempo sostenido", intensity: "media-alta", duration: "1h15", description: "30' Z3 tras calentamiento", nutrition: "Gel antes del bloque.", rest: "Acostarse antes 23h.", done: false, actual_power: null },
  { day: "Sáb", date: "15", type: "endurance", title: "Ruta larga Z2", intensity: "media", duration: "3h", description: "Ritmo constante", nutrition: "60g/h carbs. Avena antes.", rest: "Siesta post.", done: false, actual_power: null },
  { day: "Dom", date: "16", type: "recovery", title: "Rec./descanso", intensity: "baja", duration: "0-45min", description: "Según sensaciones", nutrition: "Comida equilibrada.", rest: "Foam roller. Preparar semana.", done: false, actual_power: null },
];

export const INTENSITY_LEVELS: Record<IntensityLevel, { color: string }> = {
  'alta':       { color: '#ef4444' },
  'media-alta': { color: '#f97316' },
  'media':      { color: '#eab308' },
  'baja':       { color: '#22c55e' },
  '—':          { color: '#64748b' },
};
```
