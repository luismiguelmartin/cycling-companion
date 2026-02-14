# Cycling Companion — Design System & Índice de Pantallas

Referencia visual extraída de los mockups JSX. Usar como guía para implementar componentes y mantener consistencia.

**Archivos fuente** (en `docs/design/`, excluidos de git):
- `screen-00-login-onboarding.jsx` — Login + Onboarding (4 pasos)
- `cycling-companion-full-app.jsx` — App principal (6 pantallas)

---

## 1. Pantallas

### Screen-00a: Login (`LoginScreen`)
**Ruta sugerida**: `/login`
**Fuente**: `screen-00-login-onboarding.jsx`

| Elemento | Descripción | Datos |
|----------|-------------|-------|
| **Layout split** | Dos columnas: branding (izq) + card login (der). En mobile se apilan verticalmente | — |
| **Logo + branding** | Logo grande (48x48) con shadow + nombre "Cycling Companion" | — |
| **Headline** | "Tu entrenador IA / que entiende tus datos" (segunda línea en naranja `acc`) | — |
| **Subtítulo** | Descripción de la propuesta de valor | — |
| **Feature list** | 3 items con emoji: análisis, planificación, IA explicativa (solo desktop) | — |
| **Card de login** | Card flotante con shadow pronunciada, radius `20px` | — |
| **Botón Google OAuth** | Fondo blanco, logo SVG Google, texto "Continuar con Google". Hover: translateY(-1px) + shadow | — |
| **Separador "o"** | Línea horizontal con texto "o" centrado | — |
| **Form email/password** | 2 inputs con labels: Email + Contraseña | — |
| **Botón "Entrar con email"** | Gradient naranja, opacidad 0.85 (secundario vs Google) | — |
| **Texto legal** | "Al continuar, aceptas nuestros términos..." (11px, `t4`) | — |
| **Glow effects** | 2 círculos de luz difusa (naranja top-right, azul bottom-left) con `filter: blur(100-120px)` | — |
| **Toggle tema** | Botón absoluto top-right | — |

**Responsive**: En mobile, branding arriba y card abajo apilados. Feature list oculta. Padding reducido.

**Tokens de tema adicionales** (Login/Onboarding):

| Token | Dark | Light | Uso |
|-------|------|-------|-----|
| `heroBg` | `linear-gradient(135deg, #0f1923, #162032, #1a1a2e)` | `linear-gradient(135deg, #ffffff, #f1f5f9, #e8edf5)` | Fondo pantalla login |
| `glowA` | `rgba(249,115,22,0.15)` | `rgba(249,115,22,0.08)` | Glow naranja decorativo |
| `glowB` | `rgba(59,130,246,0.1)` | `rgba(59,130,246,0.05)` | Glow azul decorativo |

---

### Screen-00b: Onboarding (`OnboardingScreen`)
**Ruta sugerida**: `/onboarding`
**Fuente**: `screen-00-login-onboarding.jsx`

Flujo de 4 pasos en una card centrada (520px desktop, 100% mobile). Se accede tras el login.

#### Indicador de progreso (`StepIndicator`)
```
  ●━━━  ●  ●  ●     (paso 1 de 4)
```
- 4 dots, el activo se expande a 32px de ancho
- Activo: `#f97316`, completado: `#f97316` al 50%, pendiente: `t4` al 30%
- Transición: `all 0.3s ease`

#### Paso 0: "¿Quién eres?" (icono: `User`)
| Campo | Placeholder | Unidad | Obligatorio |
|-------|-------------|--------|-------------|
| Nombre | "Luis Miguel" | — | Sí |
| Edad | "45" | años | Sí |
| Peso | "78" | kg | Sí |

- Edad y Peso en grid 2 columnas
- Validación: los 3 campos requeridos para habilitar "Siguiente"

#### Paso 1: "Tu rendimiento" (icono: `Heart`)
| Campo | Placeholder | Unidad | Obligatorio | Hint |
|-------|-------------|--------|-------------|------|
| FTP | "195" | W | No | "Si no lo conoces, déjalo vacío. Lo estimaremos con tus primeras sesiones." |
| FC máxima | "175" | bpm | No | Estimación: `220 - edad` bpm (calculado dinámicamente) |
| FC en reposo | "52" | bpm | No | "Mide en reposo absoluto al despertar." |

- FC máxima y FC reposo en grid 2 columnas
- Info box azul sutil al final: "No te preocupes si no tienes estos datos..."
- Todos los campos opcionales: el botón "Siguiente" siempre habilitado

#### Paso 2: "Tu objetivo" (icono: `Target`)
| Key | Emoji | Label | Descripción |
|-----|-------|-------|-------------|
| `performance` | 🎯 | Mejorar rendimiento | Subir FTP, más potencia en competición o marchas |
| `health` | 💚 | Mantener salud | Entrenar de forma sostenible y equilibrada |
| `weight_loss` | ⚖️ | Perder peso | Quemar grasa manteniendo masa muscular |
| `recovery` | 🩹 | Recuperación | Volver de una lesión o pausa prolongada |

- Cards seleccionables con borde `2px solid acc` cuando activo + icono `Check`
- Hover: borde se ilumina al 40% del acento
- Default: `performance` preseleccionado

#### Paso 3: "¡Listo!" (icono: `Check`, fondo verde)
| Elemento | Descripción |
|----------|-------------|
| **Icono step** | Fondo verde `linear-gradient(135deg, #22c55e, #16a34a)` en vez de naranja |
| **Resumen perfil** | Grid 2 cols con los datos introducidos (nombre, edad, peso, FTP, FC máx, objetivo) |
| **Tarjeta Entrenador IA** | Saludo personalizado: "¡Hola, {nombre}! Estoy listo para ayudarte..." |
| **Botón final** | "Empezar a entrenar" con icono `Activity`, gradient naranja, shadow naranja, font 15px bold |

#### Navegación del onboarding
| Elemento | Estilo |
|----------|--------|
| **Botón "Siguiente"** | Gradient naranja cuando habilitado. Gris `t4` al 30% + `cursor: not-allowed` cuando deshabilitado |
| **Botón "Atrás"** | Fondo transparente, borde `inB`, texto `t2`. No aparece en paso 0 |
| **Botón "Empezar a entrenar"** | Solo en paso 3. Gradient naranja + shadow `0 4px 20px rgba(249,115,22,0.3)`, radius 12px |

#### Flujo completo del Auth
```
LoginScreen → (onLogin) → OnboardingScreen → (onComplete) → Pantalla confirmación → Dashboard
```
- Pantalla de confirmación: icono Check verde grande (72x72), "¡Onboarding completado!", "Redirigiendo al dashboard..."

---

### Screen-01: Dashboard (`DashboardPage`)
**Ruta sugerida**: `/` o `/dashboard`

| Elemento | Descripción | Datos |
|----------|-------------|-------|
| **Header con saludo** | "Buenos días, {nombre} 👋" + resumen de semana | Nombre usuario, semana actual, nº actividades |
| **Alerta de sobrecarga** | Banner amarillo con icono `AlertTriangle` | Carga semanal vs media (%) |
| **KPI Cards (4)** | Distancia, Tiempo, Potencia media, FC media | Valor + unidad + tendencia (↑/↓ %) |
| **Gráfica: Tendencia potencia** | AreaChart (4 semanas) | `{week, power, hr}` |
| **Gráfica: Carga diaria** | BarChart (L-D) | `{day, load}` |
| **Tarjeta Entrenador IA** | Fondo degradado naranja, recomendación + tips | Texto IA + tips (hidratación, sueño, nutrición) |
| **Actividades recientes** | Lista con 4 items, badge de tipo, enlace "Ver todas" | Nombre, fecha, distancia, potencia, FC, tipo |

**Responsive**: KPIs en grid 2x2 en mobile. Gráficas apiladas. Actividades recientes en formato compacto.

---

### Screen-03: Lista de Actividades (`ActivitiesPage`)
**Ruta sugerida**: `/activities`

| Elemento | Descripción | Datos |
|----------|-------------|-------|
| **Header** | Título + contador + botón "Importar" (gradient naranja) | Nº actividades |
| **Barra de búsqueda** | Input con icono `Search` | Filtra por nombre |
| **Botón filtros** | Toggle que muestra chips de tipo | all / intervals / endurance / recovery / tempo |
| **Lista de actividades** | Cards clicables con hover. Badge tipo + métricas | nombre, fecha, tipo, dist, tiempo, potencia, FC, RPE |
| **Indicador RPE** | 10 barritas de color según valor | Verde (1-3), Amarillo (4-6), Naranja (7-8), Rojo (9-10) |

**Responsive**: Métricas en grid 4 cols en mobile. Sin indicador RPE visual en mobile.

---

### Screen-04: Detalle de Actividad (`DetailPage`)
**Ruta sugerida**: `/activities/:id`

| Elemento | Descripción | Datos |
|----------|-------------|-------|
| **Botón volver** | Icono `ArrowLeft` + "Volver" | Navega a lista |
| **Header** | Nombre actividad + badge tipo + fecha | — |
| **Métricas (6 cards)** | Distancia, Tiempo, Potencia, FC, Cadencia, TSS | Grid 6 cols (desktop) / 3 cols (mobile) |
| **Gráficas con selector** | Tabs: Potencia / FC / Cadencia | Series temporales por minuto. AreaChart |
| **Análisis IA** | Card con fondo degradado naranja | Texto analítico + recomendación + 3 tips |

**Series temporales simuladas**: Fases (warmup → intervalos → recuperación → cooldown). Generador `genTS()` crea datos realistas.

---

### Screen-05: Planificación Semanal (`PlanPage`)
**Ruta sugerida**: `/plan`

| Elemento | Descripción | Datos |
|----------|-------------|-------|
| **Header** | Título + navegación semana (← →) + botón "Recalcular" | Rango de fechas |
| **Barra de carga semanal** | Barra de progreso degradada (verde→amarillo→naranja) + TSS | TSS actual vs media |
| **Grid de 7 días** | Cards con color por tipo + indicador HOY + estado done/pending | día, fecha, tipo, título, intensidad, duración, potencia real |
| **Detalle del día seleccionado** | Card expandida con descripción + duración | Descripción del entrenamiento |
| **Card Nutrición** | Fondo amarillo sutil, icono `Sun` | Tips de alimentación |
| **Card Descanso** | Fondo violeta sutil, icono `Moon` | Tips de recuperación |

**Responsive**: Grid días 2 cols en mobile. Detalle apilado.

---

### Screen-07: Insights / Comparar (`InsightsPage`)
**Ruta sugerida**: `/insights`

| Elemento | Descripción | Datos |
|----------|-------------|-------|
| **Header** | "Comparar periodos" + subtítulo | — |
| **Selectores de periodo** | Dos badges (Periodo A azul, Periodo B naranja) con fechas | Rangos de fecha |
| **Metric cards (6)** | Valor A → Valor B + delta % con color | Distancia, Tiempo, Potencia, FC, TSS, Sesiones |
| **RadarChart** | Perfil de rendimiento con 2 series superpuestas | Volumen, Intensidad, Consistencia, Recuperación, Progresión |
| **Leyenda radar** | Cuadrados de color + etiqueta | Anterior (azul) vs Actual (naranja) |
| **Análisis IA** | Card con fondo degradado | Análisis comparativo + alertas + recomendaciones |

**Nota**: FC usa lógica invertida para delta (bajar es positivo).

---

### Screen-06: Perfil (`ProfilePage`)
**Ruta sugerida**: `/profile`

| Elemento | Descripción | Datos |
|----------|-------------|-------|
| **Header** | Título + botón "Guardar" (gradient naranja) | — |
| **Card de perfil** | Avatar con iniciales + nombre + email + badges (FTP, objetivo) | — |
| **Tabs** | Datos / Zonas / Ajustes | 3 tabs con icono + underline accent |

**Tab "Datos"**:
| Sub-elemento | Campos |
|-------------|--------|
| Datos básicos | Nombre, Edad, Peso |
| Entrenamiento | FTP, FC máxima, FC reposo |
| Objetivo | 4 opciones: Rendimiento 🎯, Salud 💚, Peso ⚖️, Recuperación 🩹 |

**Tab "Zonas"**:
| Zona | Nombre | Rango (FTP=195W) | Color |
|------|--------|-------------------|-------|
| Z1 | Recuperación | 0-110W | `#94a3b8` (gris) |
| Z2 | Resistencia | 110-150W | `#3b82f6` (azul) |
| Z3 | Tempo | 150-185W | `#22c55e` (verde) |
| Z4 | Umbral | 185-210W | `#f97316` (naranja) |
| Z5 | VO2máx | 210-245W | `#ef4444` (rojo) |
| Z6 | Anaeróbico | >245W | `#dc2626` (rojo oscuro) |

**Tab "Ajustes"**:
- Dispositivos: Placeholder "Garmin/Strava — próximamente" + importación manual .fit/.gpx
- Notificaciones: 3 toggles (alertas entrenamiento, sobrecarga, resumen semanal)

---

## 2. Guía de Estilos

### 2.1 Sistema de Temas (Dark / Light)

El tema se gestiona vía Context API (`Ctx`). Toggle en el sidebar.

**Tema oscuro** (por defecto):

| Token | Valor | Uso |
|-------|-------|-----|
| `bg` | `#0c1320` | Fondo principal |
| `sidebar` | `linear-gradient(180deg, #0f1923, #162032)` | Fondo sidebar |
| `card` | `rgba(255,255,255,0.02)` | Fondo de cards |
| `cardB` | `rgba(255,255,255,0.06)` | Borde de cards |
| `t1` | `#f1f5f9` | Texto principal |
| `t2` | `#94a3b8` | Texto secundario |
| `t3` | `#64748b` | Texto terciario / labels |
| `t4` | `#475569` | Texto deshabilitado |
| `acc` | `#f97316` | Color de acento (naranja) |
| `inBg` | `rgba(255,255,255,0.03)` | Fondo inputs |
| `inB` | `rgba(255,255,255,0.08)` | Borde inputs |
| `actBg` | `rgba(249,115,22,0.12)` | Fondo estado activo |
| `aiBg` | `linear-gradient(135deg, rgba(249,115,22,0.08), rgba(234,88,12,0.04))` | Fondo tarjetas IA |
| `aiB` | `rgba(249,115,22,0.18)` | Borde tarjetas IA |

**Tema claro**:

| Token | Valor | Uso |
|-------|-------|-----|
| `bg` | `#f8f9fb` | Fondo principal |
| `sidebar` | `linear-gradient(180deg, #ffffff, #f1f5f9)` | Fondo sidebar |
| `card` | `#ffffff` | Fondo de cards |
| `cardB` | `#e2e8f0` | Borde de cards |
| `t1` | `#0f172a` | Texto principal |
| `t2` | `#475569` | Texto secundario |
| `t3` | `#64748b` | Texto terciario |
| `t4` | `#94a3b8` | Texto deshabilitado |
| `acc` | `#ea580c` | Color de acento (naranja más oscuro) |

---

### 2.2 Paleta de Colores

#### Color de acento
| Uso | Color | Hex |
|-----|-------|-----|
| Acento principal (dark) | Naranja | `#f97316` |
| Acento principal (light) | Naranja oscuro | `#ea580c` |
| Gradient botones/logo | — | `linear-gradient(135deg, #f97316, #ea580c)` |

#### Colores semánticos
| Uso | Color | Hex |
|-----|-------|-----|
| Positivo / mejora | Verde | `#22c55e` |
| Negativo / empeorar | Rojo | `#ef4444` |
| Advertencia | Amarillo | `#eab308` |
| Info / Periodo A | Azul | `#3b82f6` |
| Secundario / tiempo | Violeta | `#8b5cf6` |

#### Colores por tipo de entrenamiento
| Tipo | Color | Hex | Emoji | Background |
|------|-------|-----|-------|------------|
| Intervalos | Rojo | `#ef4444` | 🔴 | `rgba(239,68,68,0.1)` |
| Resistencia | Verde | `#22c55e` | 🟢 | `rgba(34,197,94,0.1)` |
| Recuperación | Azul | `#3b82f6` | 🔵 | `rgba(59,130,246,0.1)` |
| Tempo | Naranja | `#f97316` | 🟠 | `rgba(249,115,22,0.1)` |
| Descanso | Gris | `#64748b` | ⚪ | `rgba(100,116,139,0.1)` |

#### Colores de intensidad
| Nivel | Hex |
|-------|-----|
| Alta | `#ef4444` |
| Media-alta | `#f97316` |
| Media | `#eab308` |
| Baja | `#22c55e` |

#### Colores RPE (barras)
| Rango | Color |
|-------|-------|
| 1-3 | `#22c55e` (verde) |
| 4-6 | `#eab308` (amarillo) |
| 7-8 | `#f97316` (naranja) |
| 9-10 | `#ef4444` (rojo) |

---

### 2.3 Tipografía

| Propiedad | Valor |
|-----------|-------|
| **Familia** | `'DM Sans', sans-serif` |
| **Carga** | Google Fonts: `wght@400;500;600;700` |

#### Escala tipográfica

| Elemento | Desktop | Mobile | Peso |
|----------|---------|--------|------|
| H1 (página) | 26px | 22px | 700 |
| H2 (sección) | 18px | 16px | 700 |
| H3 (card title) | 13-14px | 13px | 600 |
| Cuerpo | 13px | 13px | 400 |
| Cuerpo pequeño | 12px | 11px | 400 |
| Labels | 11px | 10px | 400-500 |
| Badges/tags | 10-11px | 10px | 500 |
| Micro | 9-10px | 9px | 700 (ej: "HOY") |

---

### 2.4 Espaciado y Bordes

#### Border radius

| Elemento | Valor |
|----------|-------|
| Cards principales | `14px` |
| Cards secundarias | `12px` |
| Botones / Inputs | `10px` |
| Badges | `5px` - `7px` |
| Iconos en círculo | `50%` |
| Logo / Avatar | `8px` - `14px` |

#### Padding

| Elemento | Desktop | Mobile |
|----------|---------|--------|
| Contenido principal | `32px` | `72px top, 16px sides, 24px bottom` |
| Cards | `18px` - `20px` | `12px` - `14px` |
| Botones primarios | `9px 18px` | `7px 12px` |
| Badges | `2px 8px` | `1px 6px` |
| Sidebar items | `12px 24px` | `14px 20px` |

---

### 2.5 Componentes Reutilizables

#### KPI Card
```
┌─────────────────────┐
│ [Icon]      ↑12%    │
│                     │
│ 187 km              │
│ Distancia           │
└─────────────────────┘
```
- Icono con fondo coloreado al 15% opacidad
- Badge de tendencia: verde/rojo + porcentaje
- Valor grande (20-26px bold) + unidad (13px regular)
- Label debajo (12px, t3)

#### Badge de Tipo de Entrenamiento
```
[█ Intervalos]
```
- Fondo: color al 10% opacidad
- Texto: color sólido
- Padding: `2px 8px`, radius: `5px`
- Font: 10-11px, weight 500

#### Tarjeta Entrenador IA
```
┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
│ [⚡] ENTRENADOR IA             │
│                                │
│ Texto de análisis con          │
│ highlights en naranja/color    │
│ ─────────────────────          │
│ 💧 2.5L  🌙 7.5h  ☀️ +30g    │
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
```
- Background: gradient naranja sutil (`aiBg`)
- Borde: naranja al 18% (`aiB`)
- Header: icono con gradient + texto uppercase naranja
- Tips: iconos con color semántico (azul=agua, violeta=sueño, amarillo=nutrición)
- Separador: `1px solid rgba(249,115,22,0.12)`

#### Botón Primario
```
[⚡ Importar]
```
- Background: `linear-gradient(135deg, #f97316, #ea580c)`
- Color: white
- Font: 12-13px, weight 600
- Radius: 10px
- Con icono a la izquierda

#### Input de Búsqueda
```
┌──────────────────────────┐
│ 🔍 Buscar...             │
└──────────────────────────┘
```
- Fondo: `inBg`
- Borde: `inB`
- Radius: 10px
- Icono Search a la izquierda
- Placeholder en `t3`

#### Toggle Switch
```
[  ●───] OFF     [───●  ] ON
```
- Ancho: 40px, Alto: 22px
- ON: fondo `#f97316`
- OFF: fondo `t4` al 30%
- Knob: 18px, blanco, radius 50%

#### Indicador RPE (10 barras)
```
████████░░  (RPE 8)
```
- 10 barras de 4x12px, radius 2px
- Coloreadas según valor (verde→amarillo→naranja→rojo)
- Inactivas: `t4` al 20%

#### Step Indicator (Onboarding)
```
  ━━━━  ●  ●  ●     (paso 1 activo)
```
- Dot activo: 32x8px, `#f97316`, radius 4
- Dot completado: 8x8px, `#f97316` al 50%
- Dot pendiente: 8x8px, `t4` al 30%
- Gap: 6px, transición `all 0.3s ease`

#### Onboarding Field (Input con label + unit + hint)
```
┌──────────────────────────────┐
│ Label                        │
│ ┌────────────────────┐       │
│ │ Placeholder        │  unit │
│ └────────────────────┘       │
│ hint text (opcional)         │
└──────────────────────────────┘
```
- Label: 13px, weight 500, color `t1`
- Input: padding `12px 14px`, radius 10, fontSize 15, fondo `inBg`, borde `inB`
- Unit: 13px, color `t3`, a la derecha del input
- Hint: 11px, color `t4`, debajo del input

#### Goal Card (Selección de objetivo)
```
┌─────────────────────────────┐
│ 🎯 Mejorar rendimiento  ✓  │
│    Subir FTP, más potencia  │
└─────────────────────────────┘
```
- Padding: 16px, radius 14px
- Activo: fondo `actBg`, borde `2px solid acc`, check icon
- Inactivo: fondo `inBg`, borde `1px solid inB`
- Hover (inactivo): borde al 40% del acento
- Emoji: 22px, label: 15px weight 600, desc: 12px color `t3`

#### Info Box (Onboarding)
```
┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
│ 💡 Texto informativo         │
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
```
- Fondo: `rgba(59,130,246,0.06)`, borde: `1px solid rgba(59,130,246,0.15)`
- Radius: 12px, padding: 14px
- Texto: 12px, line-height 1.6, color `t2`

#### Botón Google OAuth
```
┌──────────────────────────────┐
│  [G logo]  Continuar con Google  │
└──────────────────────────────┘
```
- Fondo: `#ffffff` (siempre blanco en ambos temas)
- Borde: `1px solid #e2e8f0`
- Shadow: `0 2px 8px rgba(0,0,0,0.06)`
- Hover: `translateY(-1px)` + shadow `0 4px 16px rgba(0,0,0,0.1)`
- Font: 15px, weight 600, color `#1f2937`
- Radius: 12px, padding: `14px 20px`
- Logo Google: SVG inline 20x20

#### Botón Secundario (texto)
```
[← Atrás]
```
- Fondo: transparente
- Borde: `1px solid inB`
- Font: 14px, weight 500, color `t2`
- Radius: 10px, padding: `10px 18px`

---

### 2.6 Iconos

Librería: **Lucide React**

| Contexto | Iconos usados |
|----------|---------------|
| Navegación sidebar | `Activity`, `BarChart3`, `Calendar`, `TrendingUp`, `User` |
| KPIs | `Activity`, `Clock`, `Zap`, `Heart` |
| Acciones | `Upload`, `Save`, `RefreshCw`, `Edit3`, `Search`, `Filter` |
| Flechas/navegación | `ChevronRight`, `ChevronLeft`, `ChevronDown`, `ArrowLeft`, `ArrowRight` |
| Tips IA | `Droplets` (agua), `Moon` (sueño), `Sun` (nutrición) |
| Alertas | `AlertTriangle` |
| UI general | `Menu`, `X`, `Bookmark`, `Shield` |
| Tema | `Sun` (claro), `Moon` (oscuro) |
| Onboarding (pasos) | `User` (datos), `Heart` (rendimiento), `Target` (objetivo), `Check` (completado) |
| Login/Auth | `Zap` (logo), `Activity` (empezar a entrenar) |

---

### 2.7 Gráficas (Recharts)

| Tipo | Pantalla | Datos |
|------|----------|-------|
| **AreaChart** | Dashboard (tendencia potencia) | 4 semanas, gradient naranja |
| **BarChart** | Dashboard (carga diaria) | 7 días, barras naranja, radius top `[5,5,0,0]` |
| **AreaChart** | Detalle actividad (series temporales) | Minuto a minuto, color según métrica seleccionada |
| **RadarChart** | Insights (perfil rendimiento) | 5 dimensiones, 2 series (azul/naranja) |

**Configuración común**:
- `CartesianGrid`: usa `t.grid` (sutil)
- `XAxis` / `YAxis`: fontSize 10-11, color `t.t3`, sin axisLine ni tickLine
- `Tooltip`: fondo `t.ttBg`, borde `t.ttB`, radius 8, fontSize 11
- Gradients: color principal al 25-30% opacidad arriba → 0% abajo

---

### 2.8 Layout

#### Desktop
```
┌──────────┬────────────────────────────────┐
│          │                                │
│ Sidebar  │       Contenido (padding 32)   │
│  220px   │                                │
│          │                                │
│  Logo    │                                │
│  Nav     │                                │
│  Theme   │                                │
│  User    │                                │
└──────────┴────────────────────────────────┘
```

#### Mobile (< 768px)
```
┌────────────────────────────────┐
│ [Logo]              [≡ Menu]   │  ← Header fijo 56px
├────────────────────────────────┤
│                                │
│  Contenido (padding 16 sides) │
│  (padding-top: 72px)          │
│                                │
└────────────────────────────────┘
```

- **Sidebar desktop**: 220px fijo, gradient vertical, border-right
- **Mobile header**: fijo top, 56px height, logo + hamburger
- **Mobile menu**: fullscreen overlay, backdrop-filter blur(12px)
- **Breakpoint**: 768px (`window.innerWidth < 768`)

---

## 3. Navegación

### Flujo de autenticación (sin sidebar)
```
/login → /onboarding (4 pasos) → /dashboard
```
- Login y Onboarding son pantallas fullscreen sin sidebar
- Tras completar onboarding, se redirige al dashboard
- Usuarios ya registrados van directo a `/dashboard`

### App principal (con sidebar)
```
Sidebar
├── Dashboard       → DashboardPage
├── Actividades     → ActivitiesPage
│   └── (click)     → DetailPage (overlay, no ruta separada en el mockup)
├── Planificación   → PlanPage
├── Insights        → InsightsPage
└── Perfil          → ProfilePage
```

- Navegación principal via sidebar (5 items)
- Detalle de actividad: se renderiza como overlay reemplazando el contenido
- Sidebar marca "Actividades" como activa cuando se muestra el detalle
- Botón "Ver todas →" en Dashboard navega a Actividades

---

## 4. Patrones de Interacción

| Patrón | Uso | Implementación |
|--------|-----|----------------|
| **Hover en cards** | Lista actividades, Goal cards (onboarding) | Cambia background a `t.hover` o border al 40% accent |
| **Selección en grid** | Días del plan semanal | Background del tipo + borde coloreado |
| **Selección exclusiva** | Objetivos (onboarding y perfil) | Borde `2px solid acc` + fondo `actBg` + icono `Check` |
| **Tabs** | Perfil (Datos/Zonas/Ajustes), Gráficas detalle | Underline accent + font-weight 600 |
| **Chips de filtro** | Tipos de actividad | Border accent cuando activo |
| **Toggle expandir** | Filtros de actividades | Botón Filter muestra/oculta chips |
| **Badges de tendencia** | KPIs | Verde ↑ / Rojo ↓ con fondo sutil |
| **Indicador "HOY"** | Grid del plan | Badge absoluto top-right, fondo naranja |
| **Estado completado** | Días del plan | Opacidad 0.7 + check verde |
| **Step indicator** | Onboarding | Dots expandibles, activo=32px naranja, completado=8px naranja 50%, pendiente=8px gris |
| **Botón deshabilitado** | Onboarding "Siguiente" | Fondo `t4` al 30%, `cursor: not-allowed`, texto `t4` |
| **Hover elevación** | Botón Google login | `translateY(-1px)` + shadow más intensa |
| **Glow decorativo** | Login | Círculos desenfocados (blur 100-120px) en esquinas opuestas |

---

## 5. Datos Mock de Referencia

### Usuario de ejemplo
- **Nombre**: Luis Miguel Martín
- **Email**: luismiguel@gmail.com
- **Edad**: 45 años
- **Peso**: 78 kg
- **FTP**: 195W
- **FC máxima**: 175 bpm
- **FC reposo**: 52 bpm
- **Objetivo**: Rendimiento (performance)

### Tipos de actividad (`TC`)
```
intervals  → "Intervalos"   🔴 #ef4444
endurance  → "Resistencia"  🟢 #22c55e
recovery   → "Recuperación" 🔵 #3b82f6
tempo      → "Tempo"        🟠 #f97316
rest       → "Descanso"     ⚪ #64748b
```

### Objetivos de usuario
```
performance  → "Rendimiento"   🎯 "Subir FTP"
health       → "Salud"         💚 "Sostenible"
weight_loss  → "Peso"          ⚖️ "Reducir grasa"
recovery     → "Recuperación"  🩹 "Volver de lesión"
```

---

## 6. Guía de Conversión: Mockups JSX → Proyecto Next.js

Los ficheros JSX en `docs/design/` son mockups funcionales que sirven como referencia visual y de comportamiento. **No se copian directamente al proyecto**, pero su lógica y estructura se reutilizan. Esta sección documenta las transformaciones necesarias.

### 6.1 Compatibilidad

| Aspecto | Mockups JSX | Proyecto Next.js 16 | Compatible |
|---------|-------------|---------------------|------------|
| React | Hooks (`useState`, `useEffect`, `useContext`) | React 19 | ✅ Directo |
| Estilos | `style={{}}` inline (objetos JS) | Tailwind CSS utility classes | ❌ Convertir |
| Iconos | `lucide-react` | `lucide-react` (instalar) | ✅ Directo |
| Gráficas | `recharts` | `recharts` (instalar) | ✅ Directo |
| Componentes | Todo en 1 fichero monolítico | Archivos individuales, App Router | ❌ Separar |
| Tema dark/light | Context API manual con objeto `T` | Tailwind `dark:` classes + CSS variables | ❌ Convertir |
| Responsive | `window.innerWidth < 768` manual | Tailwind breakpoints (`md:`, `lg:`) | ❌ Convertir |
| Tipografía | `<link>` Google Fonts inline | `next/font` (optimizado, sin FOUT) | ❌ Convertir |
| TypeScript | JavaScript puro | TypeScript estricto | ❌ Tipar |
| Componentes UI | Escritos desde cero | shadcn/ui como base | ❌ Adaptar |

### 6.2 Transformaciones principales

#### Estilos inline → Tailwind CSS

Es el cambio más grande. Cada `style={{}}` se convierte a clases de Tailwind.

```jsx
// ❌ Mockup (inline)
<div style={{
  padding: 12,
  borderRadius: 14,
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.06)"
}}>

// ✅ Proyecto (Tailwind)
<div className="p-3 rounded-[14px] bg-white/[0.02] border border-white/[0.06]">
```

#### Sistema de temas → Tailwind dark mode

Los tokens del objeto `T` se mapean a CSS custom properties + clases `dark:`.

```jsx
// ❌ Mockup
const t = useT(); // T.dark.t1 = "#f1f5f9", T.light.t1 = "#0f172a"
<h1 style={{ color: t.t1 }}>Título</h1>

// ✅ Proyecto (Tailwind con dark mode)
<h1 className="text-slate-900 dark:text-slate-100">Título</h1>
```

**Mapeo de tokens a Tailwind** (referencia rápida):

| Token | Dark | Light | Tailwind equivalente |
|-------|------|-------|---------------------|
| `t1` | `#f1f5f9` | `#0f172a` | `text-slate-900 dark:text-slate-100` |
| `t2` | `#94a3b8` | `#475569` | `text-slate-600 dark:text-slate-400` |
| `t3` | `#64748b` | `#64748b` | `text-slate-500` |
| `t4` | `#475569` | `#94a3b8` | `text-slate-400 dark:text-slate-600` |
| `bg` | `#0c1320` | `#f8f9fb` | CSS var `--bg` o `bg-slate-50 dark:bg-[#0c1320]` |
| `card` | `rgba(255,255,255,0.02)` | `#ffffff` | `bg-white dark:bg-white/[0.02]` |
| `cardB` | `rgba(255,255,255,0.06)` | `#e2e8f0` | `border-slate-200 dark:border-white/[0.06]` |
| `acc` | `#f97316` | `#ea580c` | `text-orange-500 dark:text-orange-400` |

Para tokens complejos (gradients, shadows), usar CSS custom properties en `globals.css`:

```css
:root {
  --ai-bg: linear-gradient(135deg, rgba(249,115,22,0.06), rgba(234,88,12,0.02));
  --ai-border: rgba(249,115,22,0.2);
}
.dark {
  --ai-bg: linear-gradient(135deg, rgba(249,115,22,0.08), rgba(234,88,12,0.04));
  --ai-border: rgba(249,115,22,0.18);
}
```

#### Responsive → Tailwind breakpoints

```jsx
// ❌ Mockup
const mob = useMobile(); // window.innerWidth < 768
<div style={{ padding: mob ? 12 : 18 }}>
<div style={{ gridTemplateColumns: mob ? "1fr" : "1fr 1fr" }}>

// ✅ Proyecto (Tailwind mobile-first)
<div className="p-3 md:p-[18px]">
<div className="grid grid-cols-1 md:grid-cols-2">
```

El hook `useMobile()` desaparece: Tailwind lo resuelve con breakpoints (`md:` = 768px).

#### Tipografía → next/font

```jsx
// ❌ Mockup
<link href="https://fonts.googleapis.com/css2?family=DM+Sans..." rel="stylesheet" />
<div style={{ fontFamily: "'DM Sans', sans-serif" }}>

// ✅ Proyecto (next/font)
// En layout.tsx:
import { DM_Sans } from "next/font/google";
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400","500","600","700"] });
<body className={dmSans.className}>
```

#### Componentes → shadcn/ui como base

Muchos componentes del mockup tienen equivalente en shadcn/ui. Usarlos como base y personalizar:

| Componente mockup | shadcn/ui equivalente | Personalización |
|-------------------|----------------------|-----------------|
| Input de búsqueda | `<Input />` | Añadir icono Search a la izquierda |
| Toggle switch | `<Switch />` | Colores naranja para ON |
| Tabs (Perfil) | `<Tabs />` | Underline style en vez de background |
| Botón primario | `<Button />` | Variant con gradient naranja |
| Card genérica | `<Card />` | Border + radius del design system |
| Badge tipo | `<Badge />` | Variantes por tipo de entrenamiento |
| Tooltip gráficas | Recharts `<Tooltip />` | Mantener config del mockup |

#### Estructura de archivos: 1 monolito → App Router

```
// ❌ Mockup: todo en 1 fichero con switch(page)

// ✅ Proyecto: App Router
app/
├── (auth)/
│   ├── login/page.tsx          ← LoginScreen
│   └── onboarding/page.tsx     ← OnboardingScreen (4 steps)
├── (app)/
│   ├── layout.tsx              ← Sidebar + contenedor principal
│   ├── dashboard/page.tsx      ← DashboardPage
│   ├── activities/
│   │   ├── page.tsx            ← ActivitiesPage
│   │   └── [id]/page.tsx       ← DetailPage
│   ├── plan/page.tsx           ← PlanPage
│   ├── insights/page.tsx       ← InsightsPage
│   └── profile/page.tsx        ← ProfilePage
components/
├── ui/                         ← shadcn/ui base (Button, Card, Badge, Input, etc.)
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

### 6.3 Lo que se reutiliza directamente

- **Estructura y layout** de cada pantalla (qué va dónde, orden de secciones)
- **Datos mock** (arrays `ACTS`, `PLAN`, `wkTrend`, `dayLoad`, `cmpMetrics`, `radarD`, `PZ`)
- **Lógica de componentes** (filtros, selección, tabs, step indicator, validación onboarding)
- **Configuración de Recharts** (gráficas, gradients, tooltips, ejes)
- **Paleta de colores y tokens** (documentados en sección 2)
- **Iconos Lucide** (misma librería, mismos nombres)
- **Textos y copy** (saludo, análisis IA, tips, labels)

### 6.4 Dependencias a instalar

```bash
pnpm --filter web add lucide-react recharts
pnpm dlx shadcn@latest init   # si no está configurado
```

Componentes shadcn/ui recomendados:
```bash
pnpm dlx shadcn@latest add button card badge input tabs switch
```
