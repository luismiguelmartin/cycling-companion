# L1 — Spec Funcional: Perfil

> **Fuente**: `docs/design/cycling-companion-full-app.jsx`
> **Requisito PRD**: F08 — Perfil y ajustes (P1)
> **Fecha**: 2026-02-14

---

## 1. Resumen de la Pantalla

La pantalla de Perfil permite al usuario gestionar sus datos personales, datos de entrenamiento, visualizar zonas de potencia/FC calculadas, y configurar ajustes de la aplicación.

| Pantalla | Componente JSX | Propósito |
|----------|---------------|-----------|
| **Perfil** | `ProfilePage` | Gestión de datos personales, datos de entrenamiento (FTP, FC), zonas automáticas, objetivo, y ajustes. |

**Requisito PRD asociado**: F08 — Gestión de datos personales y configuración. Secciones: datos personales, datos de entrenamiento, zonas automáticas, objetivo actual, preferencias.

---

## 2. Ruta y Navegación

### Rutas propuestas

| Pantalla | Ruta | Route Group |
|----------|------|-------------|
| Perfil | `/profile` | `(app)` |

### Flujo de navegación

```
Sidebar "Perfil" → /profile
                      │
              ┌───────┴────────┐
              │                │
        Tab "Datos"     Tab "Zonas"     Tab "Ajustes"
              │                │                │
     Editar campos    Visualizar zonas    Configurar
              │         (reactivo)       notificaciones
              │
        [Guardar]
              │
    PUT /api/v1/profile
              │
    Toast confirmación
```

### Condiciones de acceso

| Ruta | Auth requerida | Condición adicional |
|------|---------------|---------------------|
| `/profile` | Sí | Si no completó onboarding → redirect a `/onboarding` |

---

## 3. Componentes Identificados

### 3.1 ProfileHeader

| Campo | Valor |
|-------|-------|
| **Nombre** | `ProfileHeader` |
| **Tipo** | Server Component — renderiza datos del perfil |
| **Props** | `name: string` (obligatoria), `email: string` (obligatoria), `ftp: number \| null` (obligatoria), `goal: GoalType` (obligatoria), `avatarUrl?: string` (opcional) |
| **Estados** | Default único |
| **Tokens** | Card fondo: `card`. Card borde: `cardB`. Avatar: gradient naranja `linear-gradient(135deg, #f97316, #ea580c)` con iniciales blancas (20px, weight 700). Nombre: `t1` (18px, weight 700). Email: `t3` (13px). Badge FTP: fondo `rgba(249,115,22,0.12)` (dark) / `rgba(249,115,22,0.08)` (light), texto `acc`. Badge objetivo: fondo `actBg`, texto `t1`. |
| **Responsive** | Sin diferencias significativas. Padding 20px desktop, 14px mobile. |
| **Contenido** | Avatar con iniciales (o imagen si disponible) + nombre + email + badge "FTP {X}W" + badge objetivo |
| **Reutilizable** | No — específico de la pantalla Perfil |

**Avatar**: Si no hay `avatarUrl`, mostrar iniciales del nombre sobre fondo gradient naranja. Contenedor 56x56px, borderRadius 14px.

**Badges**:

| Badge | Texto | Estilo |
|-------|-------|--------|
| FTP | "FTP {X}W" (o "FTP —" si null) | Fondo `rgba(249,115,22,0.12)`, texto `#f97316`, 11px, weight 500, padding `2px 8px`, radius 5px |
| Objetivo | Label del goal (ej: "Rendimiento") | Fondo `actBg`, texto `t1`, 11px, weight 500, padding `2px 8px`, radius 5px |

### 3.2 ProfileTabs

| Campo | Valor |
|-------|-------|
| **Nombre** | `ProfileTabs` |
| **Tipo** | Client Component — gestiona tab activa + estado del formulario |
| **Props** | `profile: UserProfile` (obligatoria) |
| **Estados** | Tab activa: `datos` (default) / `zonas` / `ajustes`. Datos del formulario editados (dirty state). Guardando (loading). |
| **Tokens** | Tab activa: texto `acc` (13px, weight 600), underline `acc` (2px). Tab inactiva: texto `t3` (13px, weight 400). Separador: `cardB`. |
| **Responsive** | Desktop: tabs en línea. Mobile: tabs en scroll horizontal si es necesario. |
| **Contenido** | 3 tabs con icono: Datos (User), Zonas (BarChart3), Ajustes (Settings) |
| **Reutilizable** | Parcialmente — el patrón de tabs se reutiliza en Detalle de Actividad (tabs de gráficas) |

**Tabs**:

| Tab | Icono | Label |
|-----|-------|-------|
| `datos` | `User` | Datos |
| `zonas` | `BarChart3` | Zonas |
| `ajustes` | `Settings` | Ajustes |

### 3.3 Tab "Datos"

#### BasicDataSection

| Campo | Valor |
|-------|-------|
| **Nombre** | `BasicDataSection` (inline en ProfileTabs) |
| **Tipo** | Client Component — inputs controlados |
| **Props** | Hereda estado del formulario de ProfileTabs |
| **Estados** | Inputs editables con valores del perfil |
| **Tokens** | Título sección: `t1` (16px, weight 700). Input: tokens de `OnboardingField`. |
| **Responsive** | Desktop: Nombre en 1 col, Edad + Peso en grid 2 cols. Mobile: todo en 1 col. |
| **Contenido** | Título "Datos básicos" + 3 campos |

**Campos**:

| Campo | Placeholder | Unidad | Obligatorio | Componente |
|-------|-------------|--------|-------------|------------|
| Nombre | "Luis Miguel" | — | Sí | `OnboardingField` ♻️ |
| Edad | "45" | años | Sí | `OnboardingField` ♻️ |
| Peso | "78" | kg | Sí | `OnboardingField` ♻️ |

#### TrainingDataSection

| Campo | Valor |
|-------|-------|
| **Nombre** | `TrainingDataSection` (inline en ProfileTabs) |
| **Tipo** | Client Component — inputs controlados |
| **Props** | Hereda estado del formulario de ProfileTabs |
| **Estados** | Inputs editables |
| **Tokens** | Mismo que BasicDataSection |
| **Responsive** | FTP en 1 col, FC máx + FC reposo en grid 2 cols. Mobile: todo en 1 col. |
| **Contenido** | Título "Entrenamiento" + 3 campos |

**Campos**:

| Campo | Placeholder | Unidad | Obligatorio | Hint | Componente |
|-------|-------------|--------|-------------|------|------------|
| FTP | "195" | W | No | "Potencia sostenible durante 1 hora" | `OnboardingField` ♻️ |
| FC máxima | "175" | bpm | No | Estimación: `220 - edad` bpm | `OnboardingField` ♻️ |
| FC en reposo | "52" | bpm | No | "Mide en reposo absoluto al despertar" | `OnboardingField` ♻️ |

**Nota**: Los hints son los mismos que en el Onboarding (paso 1). Se reutiliza `OnboardingField` directamente.

#### GoalSection

| Campo | Valor |
|-------|-------|
| **Nombre** | `GoalSection` (inline en ProfileTabs) |
| **Tipo** | Client Component — selección interactiva |
| **Props** | Hereda estado del formulario de ProfileTabs |
| **Estados** | Un GoalCard activo (el del objetivo actual), los demás inactivos |
| **Tokens** | Mismo que GoalCard del Onboarding |
| **Responsive** | Desktop: 4 cards en columna. Mobile: igual, 1 columna. |
| **Contenido** | Título "Objetivo" + 4 GoalCards |

**Goals**: Se reutilizan la constante `GOALS` de `packages/shared/src/constants/goals.ts` y el componente `GoalCard` del Onboarding.

#### SaveButton

| Campo | Valor |
|-------|-------|
| **Nombre** | `SaveButton` |
| **Tipo** | Client Component — onClick + loading state |
| **Props** | `onClick: () => void` (obligatoria), `disabled: boolean` (obligatoria), `loading: boolean` (obligatoria) |
| **Estados** | **Default**: gradient naranja, habilitado. **Disabled**: sin cambios (opacidad reducida). **Loading**: spinner + "Guardando...". |
| **Tokens** | Gradient: `linear-gradient(135deg, #f97316, #ea580c)`. Texto: blanco, 13px, weight 600. Radius: 10px. |
| **Responsive** | En el header del perfil, junto al título. |
| **Contenido** | Icono `Save` + "Guardar" (o "Guardando..." con spinner) |
| **Reutilizable** | Sí — patrón de botón primario reutilizable |

**Posición**: El botón "Guardar" se ubica en el header de la página, a la derecha del título "Perfil". Solo se habilita cuando hay cambios sin guardar (dirty state).

---

### 3.4 Tab "Zonas"

#### ZoneTable (Potencia)

| Campo | Valor |
|-------|-------|
| **Nombre** | `ZoneTable` |
| **Tipo** | Client Component — reactivo al cambio de FTP |
| **Props** | `type: 'power' \| 'hr'` (obligatoria), `referenceValue: number \| null` (obligatoria, FTP o FCmax), `label: string` (obligatoria) |
| **Estados** | Con valor: tabla de zonas calculadas. Sin valor (null): mensaje "Introduce tu FTP/FC máxima para ver las zonas". |
| **Tokens** | Card fondo: `card`. Card borde: `cardB`. Título: `t1` (16px, weight 700). Subtítulo: `t3` (12px). Zona nombre: `t1` (13px, weight 500). Zona rango: `t2` (12px). Barra: color de la zona con opacidad progresiva (anchura proporcional). |
| **Responsive** | Sin diferencias — tabla de ancho completo |
| **Contenido** | Título "Zonas de Potencia (basadas en FTP {X}W)" + 6 filas con barra coloreada |
| **Reutilizable** | Sí — se usa dos veces (potencia y FC) |

**Zonas de Potencia (basadas en FTP)**:

| Zona | Nombre | Rango (% FTP) | Color |
|------|--------|---------------|-------|
| Z1 | Recuperación | 0-56% | `#94a3b8` (gris) |
| Z2 | Resistencia | 56-75% | `#3b82f6` (azul) |
| Z3 | Tempo | 76-90% | `#22c55e` (verde) |
| Z4 | Umbral | 91-105% | `#f97316` (naranja) |
| Z5 | VO2máx | 106-120% | `#ef4444` (rojo) |
| Z6 | Anaeróbico | >120% | `#dc2626` (rojo oscuro) |

**Zonas de FC (basadas en FCmax)**:

| Zona | Nombre | Rango (% FCmax) | Color |
|------|--------|-----------------|-------|
| Z1 | Recuperación | 50-60% | `#94a3b8` |
| Z2 | Resistencia | 60-70% | `#3b82f6` |
| Z3 | Tempo | 70-80% | `#22c55e` |
| Z4 | Umbral | 80-90% | `#f97316` |
| Z5 | VO2máx | 90-100% | `#ef4444` |

**Comportamiento reactivo**: Cuando el usuario cambia el FTP en la tab "Datos", al navegar a la tab "Zonas" las zonas se recalculan automáticamente con el nuevo valor (client-side, antes de guardar). Esto permite al usuario previsualizar las zonas con un nuevo FTP sin comprometerse.

**Diseño de fila de zona**:
```
┌────────────────────────────────────────────────────┐
│ Z1 │ Recuperación │ 0-110W │ ████████              │
│ Z2 │ Resistencia  │ 110-150W │ ██████████████       │
│ Z3 │ Tempo        │ 150-185W │ ████████████████████ │
│ Z4 │ Umbral       │ 185-210W │ ██████████████████████│
│ Z5 │ VO2máx       │ 210-245W │ ████████████████████████│
│ Z6 │ Anaeróbico   │ >245W    │ ██████████████████████████│
└────────────────────────────────────────────────────┘
```

Cada barra tiene anchura proporcional al rango máximo de la zona respecto a Z6 max.

---

### 3.5 Tab "Ajustes"

#### DevicesSection

| Campo | Valor |
|-------|-------|
| **Nombre** | `DevicesSection` (inline) |
| **Tipo** | Server Component — solo renderiza contenido estático |
| **Props** | Ninguna |
| **Estados** | Default único (placeholder) |
| **Tokens** | Card fondo: `card`. Card borde: `cardB`. Título: `t1` (16px, weight 700). Texto: `t3` (13px). |
| **Responsive** | Sin diferencias |
| **Contenido** | Título "Dispositivos" + card placeholder "Garmin / Strava — próximamente" + "Importación manual .fit/.gpx disponible" |
| **Reutilizable** | No |

#### NotificationsSection

| Campo | Valor |
|-------|-------|
| **Nombre** | `NotificationsSection` (inline) |
| **Tipo** | Client Component — toggles interactivos |
| **Props** | Hereda estado de ProfileTabs |
| **Estados** | 3 toggles con estado on/off |
| **Tokens** | Card fondo: `card`. Card borde: `cardB`. Título: `t1` (16px, weight 700). Label toggle: `t1` (13px). Descripción: `t3` (12px). |
| **Responsive** | Sin diferencias — toggles apilados |
| **Contenido** | Título "Notificaciones" + 3 toggles |

**Toggles**:

| Toggle | Label | Descripción | Default |
|--------|-------|-------------|---------|
| Alertas de entrenamiento | Alertas de entrenamiento | "Recordatorios y sugerencias del coach" | OFF |
| Sobrecarga detectada | Sobrecarga detectada | "Aviso cuando tu carga supera los umbrales" | ON |
| Resumen semanal | Resumen semanal | "Informe semanal de tu progreso" | OFF |

**Diseño del toggle** (ref: DESIGN-SYSTEM.md §2.5):
- Ancho: 40px, Alto: 22px
- ON: fondo `#f97316`
- OFF: fondo `t4` al 30%
- Knob: 18px, blanco, radius 50%

**Nota**: Las notificaciones no tienen infraestructura backend todavía. Se guardará la preferencia en la tabla `users` (campo nuevo o tabla `user_preferences`). Para el MVP, los toggles son funcionales visualmente pero no disparan notificaciones reales.

---

## 4. Jerarquía de Componentes

```
AppLayout (layout.tsx — Server Component)
├── Sidebar (Client) ♻️
│
└── ProfilePage (page.tsx — Server Component)
    ├── PageHeader (inline)
    │   ├── Título "Perfil"
    │   └── SaveButton (Client)
    │
    ├── ProfileHeader (Server)
    │   ├── Avatar (iniciales o imagen)
    │   ├── Nombre + Email
    │   └── Badges (FTP, Objetivo)
    │
    └── ProfileTabs (Client — gestiona estado form + tab activa)
        │
        ├── [Tab "Datos"]
        │   ├── BasicDataSection
        │   │   ├── OnboardingField "Nombre" ♻️
        │   │   ├── OnboardingField "Edad" ♻️
        │   │   └── OnboardingField "Peso" ♻️
        │   │
        │   ├── TrainingDataSection
        │   │   ├── OnboardingField "FTP" ♻️
        │   │   ├── OnboardingField "FC máxima" ♻️
        │   │   └── OnboardingField "FC reposo" ♻️
        │   │
        │   └── GoalSection
        │       ├── GoalCard "Rendimiento" ♻️
        │       ├── GoalCard "Salud" ♻️
        │       ├── GoalCard "Peso" ♻️
        │       └── GoalCard "Recuperación" ♻️
        │
        ├── [Tab "Zonas"]
        │   ├── ZoneTable type="power" (6 zonas)
        │   └── ZoneTable type="hr" (5 zonas)
        │
        └── [Tab "Ajustes"]
            ├── DevicesSection (placeholder)
            └── NotificationsSection
                ├── Toggle "Alertas de entrenamiento"
                ├── Toggle "Sobrecarga detectada"
                └── Toggle "Resumen semanal"
```

**Leyenda**: ♻️ = Componente reutilizable (ya existe del Onboarding)

---

## 5. Datos Necesarios

### Datos del Servidor

| Dato | Fuente | Cuándo |
|------|--------|--------|
| Perfil completo del usuario | `supabase.from('users').select('*')` | Al cargar `/profile` |
| Estado de autenticación | `supabase.auth.getUser()` | Al cargar `/profile` (en Server Component) |

### Datos del Cliente (Estado Local)

| Dato | Tipo | Componente | Valor inicial |
|------|------|-----------|---------------|
| `activeTab` | `'datos' \| 'zonas' \| 'ajustes'` | ProfileTabs | `'datos'` |
| `formData.display_name` | `string` | ProfileTabs | Valor del perfil |
| `formData.age` | `string` | ProfileTabs | Valor del perfil |
| `formData.weight_kg` | `string` | ProfileTabs | Valor del perfil |
| `formData.ftp` | `string` | ProfileTabs | Valor del perfil (o `""`) |
| `formData.max_hr` | `string` | ProfileTabs | Valor del perfil (o `""`) |
| `formData.rest_hr` | `string` | ProfileTabs | Valor del perfil (o `""`) |
| `formData.goal` | `GoalType` | ProfileTabs | Valor del perfil |
| `isDirty` | `boolean` | ProfileTabs | `false` |
| `isSaving` | `boolean` | ProfileTabs | `false` |
| `notifications` | `{ alerts: boolean, overload: boolean, weekly: boolean }` | NotificationsSection | Valores del perfil (o defaults) |

### Contrato de datos (edición)

```typescript
// Datos que se envían al guardar (PUT /api/v1/profile)
interface ProfileUpdatePayload {
  display_name: string;
  age: number;
  weight_kg: number;
  ftp: number | null;
  max_hr: number | null;
  rest_hr: number | null;
  goal: GoalType;
}
```

**Mapeo a tabla `users`**:

| Campo del form | Campo en `users` | Tipo DB | Notas |
|---------------|-----------------|---------|-------|
| `display_name` | `display_name` | `text NOT NULL` | Obligatorio |
| `age` | `age` | `integer NOT NULL` | Obligatorio |
| `weight_kg` | `weight_kg` | `numeric NOT NULL` | Obligatorio |
| `ftp` | `ftp` | `integer` | Nullable |
| `max_hr` | `max_hr` | `integer` | Nullable |
| `rest_hr` | `rest_hr` | `integer` | Nullable |
| `goal` | `goal` | `text NOT NULL` | CHECK constraint |

**Validación**: Se reutiliza el schema Zod `onboardingSchema` de `packages/shared` para validar los datos antes de enviar. Los constraints son idénticos.

---

## 6. Flujos de Interacción

### Flujo 1: Carga del perfil (flujo feliz)

1. Usuario navega a `/profile` desde el Sidebar.
2. Server Component obtiene el perfil del usuario de Supabase.
3. Renderiza ProfileHeader con los datos actuales.
4. Renderiza ProfileTabs con tab "Datos" activa y los inputs pre-rellenados.
5. El botón "Guardar" aparece deshabilitado (no hay cambios).

### Flujo 2: Editar datos y guardar (flujo feliz)

1. Usuario está en tab "Datos".
2. Cambia el FTP de 195 a 210.
3. El botón "Guardar" se habilita (isDirty = true).
4. Puede navegar a tab "Zonas" para ver las zonas recalculadas con FTP=210.
5. Vuelve a tab "Datos", clic en "Guardar".
6. Se ejecuta validación Zod client-side.
7. PUT `/api/v1/profile` (o UPDATE directo a Supabase).
8. Botón muestra "Guardando..." con spinner.
9. Respuesta OK → toast "Perfil actualizado" → isDirty = false.
10. ProfileHeader se actualiza con los nuevos badges.

### Flujo 3: Cambiar objetivo

1. Usuario está en tab "Datos", sección "Objetivo".
2. "Rendimiento" está activo (borde naranja + check).
3. Clic en "Salud" → "Salud" se activa, "Rendimiento" se desactiva.
4. isDirty = true → botón "Guardar" se habilita.
5. Clic "Guardar" → goal se actualiza a `health`.
6. La recomendación IA del Dashboard se regenerará en la próxima carga teniendo en cuenta el nuevo objetivo.

### Flujo 4: Previsualizar zonas antes de guardar

1. Usuario cambia FTP de 195 a 220 en tab "Datos".
2. Sin guardar, navega a tab "Zonas".
3. Las zonas se muestran calculadas con FTP=220 (valor local del formulario).
4. El usuario puede comparar con los valores anteriores visualmente.
5. Si está satisfecho, vuelve a "Datos" y guarda.
6. Si no, puede revertir el FTP al valor original cancelando el cambio.

### Flujo 5: Perfil sin FTP ni FC

1. Usuario completó el onboarding sin introducir FTP ni FC.
2. En tab "Datos", los campos de FTP, FC máx y FC reposo están vacíos.
3. En tab "Zonas", se muestra: "Introduce tu FTP para ver las zonas de potencia" y "Introduce tu FC máxima para ver las zonas de frecuencia cardíaca".
4. El usuario puede introducir los valores y guardar.

### Flujo 6: Error de validación

1. Usuario borra el campo "Nombre" (obligatorio).
2. Intenta guardar.
3. Validación Zod falla: "El nombre es obligatorio".
4. El campo se marca con borde rojo y mensaje de error debajo.
5. El guardado no se ejecuta.

### Flujo 7: Toggle de notificaciones

1. Usuario navega a tab "Ajustes".
2. "Sobrecarga detectada" está ON (por defecto).
3. Clic en el toggle → cambia a OFF.
4. isDirty = true → botón "Guardar" se habilita.
5. Clic "Guardar" → preferencia guardada.

---

## 7. Tokens de Tema Aplicables

### Perfil

| Elemento | Token | Dark | Light |
|----------|-------|------|-------|
| Fondo página | `bg` | `#0c1320` | `#f8f9fb` |
| Card fondo | `card` | `rgba(255,255,255,0.02)` | `#ffffff` |
| Card borde | `cardB` | `rgba(255,255,255,0.06)` | `#e2e8f0` |
| Avatar fondo | — | `linear-gradient(135deg, #f97316, #ea580c)` | `linear-gradient(135deg, #ea580c, #f97316)` |
| Nombre | `t1` | `#f1f5f9` | `#0f172a` |
| Email | `t3` | `#64748b` | `#64748b` |
| Badge FTP fondo | — | `rgba(249,115,22,0.12)` | `rgba(249,115,22,0.08)` |
| Badge FTP texto | `acc` | `#f97316` | `#ea580c` |
| Tab activa texto | `acc` | `#f97316` | `#ea580c` |
| Tab activa underline | `acc` | `#f97316` | `#ea580c` |
| Tab inactiva texto | `t3` | `#64748b` | `#64748b` |
| Título sección | `t1` | `#f1f5f9` | `#0f172a` |
| Input fondo | `inBg` | `rgba(255,255,255,0.04)` | `#f8fafc` |
| Input borde | `inB` | `rgba(255,255,255,0.08)` | `#e2e8f0` |
| GoalCard activo fondo | `actBg` | `rgba(249,115,22,0.12)` | `rgba(249,115,22,0.08)` |
| GoalCard activo borde | `acc` | `#f97316` | `#ea580c` |
| Toggle ON | — | `#f97316` | `#ea580c` |
| Toggle OFF | `t4` al 30% | `rgba(71,85,105,0.3)` | `rgba(148,163,184,0.3)` |
| Zona Z1 | — | `#94a3b8` | `#94a3b8` |
| Zona Z2 | — | `#3b82f6` | `#3b82f6` |
| Zona Z3 | — | `#22c55e` | `#22c55e` |
| Zona Z4 | — | `#f97316` | `#ea580c` |
| Zona Z5 | — | `#ef4444` | `#ef4444` |
| Zona Z6 | — | `#dc2626` | `#dc2626` |
| Error input borde | — | `#ef4444` | `#ef4444` |
| Error texto | — | `#ef4444` | `#ef4444` |

---

## 8. Componentes Reutilizables

| Componente | Usado en Perfil | Reutilizado de | shadcn/ui base | Crear custom |
|------------|----------------|----------------|----------------|--------------|
| **OnboardingField** | 6 campos (Datos) | Onboarding (ya existe) | No — custom | Ya existe ♻️ |
| **GoalCard** | 4 cards (Objetivo) | Onboarding (ya existe) | No — custom | Ya existe ♻️ |
| **ThemeToggle** | Sidebar | Auth flow (ya existe) | No — custom | Ya existe ♻️ |
| **Sidebar** | Layout | Dashboard (compartido) | No — custom | Sí (se crea en Dashboard) |
| **ZoneTable** | 2 tablas (Potencia + FC) | Nuevo — específico de Perfil | No — custom | Sí |
| **SaveButton** | Header | Nuevo | `Button` de shadcn como base | Wrapper custom |
| **ProfileHeader** | Header perfil | Nuevo — específico | No — custom | Sí |
| **ProfileTabs** | Contenedor tabs | Nuevo | `Tabs` de shadcn/ui | Wrapper custom |

---

## 9. Transformaciones JSX Necesarias

### Tabs → shadcn/ui Tabs

```jsx
// ❌ Mockup (inline)
<div style={{ display: 'flex', gap: 0, borderBottom: '1px solid ...' }}>
  {tabs.map(tab => (
    <div style={{
      padding: '12px 24px',
      borderBottom: activeTab === tab.id ? '2px solid #f97316' : 'none',
      color: activeTab === tab.id ? '#f97316' : '#64748b',
    }} />
  ))}
</div>

// ✅ Proyecto (shadcn/ui Tabs + Tailwind)
<Tabs defaultValue="datos">
  <TabsList className="border-b border-[var(--card-border)]">
    <TabsTrigger value="datos" className="data-[state=active]:text-[var(--accent)] data-[state=active]:border-b-2 data-[state=active]:border-[var(--accent)]">
      Datos
    </TabsTrigger>
    ...
  </TabsList>
  <TabsContent value="datos">...</TabsContent>
</Tabs>
```

### Toggle Switch

```jsx
// ❌ Mockup (inline)
<div style={{
  width: 40, height: 22, borderRadius: 11,
  background: enabled ? '#f97316' : 'rgba(...)',
}} onClick={toggle}>
  <div style={{
    width: 18, height: 18, borderRadius: '50%',
    transform: enabled ? 'translateX(18px)' : 'translateX(2px)',
  }} />
</div>

// ✅ Proyecto (shadcn Switch o custom)
<Switch checked={enabled} onCheckedChange={toggle}
  className="data-[state=checked]:bg-orange-500" />
```

### Zone Bars

```jsx
// ❌ Mockup (inline)
<div style={{
  width: `${(zone.max / maxValue) * 100}%`,
  height: 8, borderRadius: 4,
  background: zone.color,
}} />

// ✅ Proyecto (Tailwind)
<div
  className="h-2 rounded-full"
  style={{ width: `${percentage}%`, backgroundColor: zone.color }}
/>
```

### Formulario controlado

```typescript
// Estado local del formulario
const [formData, setFormData] = useState({
  display_name: profile.display_name,
  age: String(profile.age),
  weight_kg: String(profile.weight_kg),
  ftp: profile.ftp ? String(profile.ftp) : '',
  max_hr: profile.max_hr ? String(profile.max_hr) : '',
  rest_hr: profile.rest_hr ? String(profile.rest_hr) : '',
  goal: profile.goal,
});

// isDirty: comparar formData con valores originales del perfil
const isDirty = useMemo(() => {
  return formData.display_name !== profile.display_name
    || formData.age !== String(profile.age)
    // ... etc
}, [formData, profile]);
```

---

## 10. Dependencias Externas

### Paquetes npm

| Paquete | Uso | Ya instalado |
|---------|-----|-------------|
| `lucide-react` | Iconos: User, BarChart3, Settings, Save, Check, Target, Heart, TrendingDown, Shield | Sí |
| `next-themes` | Toggle de tema en Sidebar | Sí |
| `@supabase/ssr` | Query y update de perfil | Sí |

### Componentes shadcn/ui a instalar

| Componente | Uso |
|------------|-----|
| `tabs` | Base para ProfileTabs (TabsList, TabsTrigger, TabsContent) |
| `switch` | Base para toggles de notificaciones |

### Integraciones

| Servicio | Uso | Estado |
|----------|-----|--------|
| Supabase DB (tabla `users`) | Leer y actualizar perfil | ✅ Tabla creada (migration 001 + 002) |
| Supabase Auth | Verificación de sesión | ✅ Implementado |
| Fastify API (PUT /api/v1/profile) | Endpoint de actualización | ❌ Por implementar (alternativa: update directo a Supabase) |

---

## Apéndice: Constantes de Zonas de Potencia (Reutilizable)

```typescript
export const POWER_ZONES = [
  { zone: 'Z1', name: 'Recuperación',  minPct: 0,    maxPct: 0.56, color: '#94a3b8' },
  { zone: 'Z2', name: 'Resistencia',   minPct: 0.56, maxPct: 0.75, color: '#3b82f6' },
  { zone: 'Z3', name: 'Tempo',         minPct: 0.76, maxPct: 0.90, color: '#22c55e' },
  { zone: 'Z4', name: 'Umbral',        minPct: 0.91, maxPct: 1.05, color: '#f97316' },
  { zone: 'Z5', name: 'VO2máx',        minPct: 1.06, maxPct: 1.20, color: '#ef4444' },
  { zone: 'Z6', name: 'Anaeróbico',    minPct: 1.20, maxPct: Infinity, color: '#dc2626' },
] as const;

export const HR_ZONES = [
  { zone: 'Z1', name: 'Recuperación',  minPct: 0.50, maxPct: 0.60, color: '#94a3b8' },
  { zone: 'Z2', name: 'Resistencia',   minPct: 0.60, maxPct: 0.70, color: '#3b82f6' },
  { zone: 'Z3', name: 'Tempo',         minPct: 0.70, maxPct: 0.80, color: '#22c55e' },
  { zone: 'Z4', name: 'Umbral',        minPct: 0.80, maxPct: 0.90, color: '#f97316' },
  { zone: 'Z5', name: 'VO2máx',        minPct: 0.90, maxPct: 1.00, color: '#ef4444' },
] as const;

export function calculateZones(
  zones: typeof POWER_ZONES | typeof HR_ZONES,
  referenceValue: number
) {
  return zones.map(z => ({
    ...z,
    min: Math.round(referenceValue * z.minPct),
    max: z.maxPct === Infinity ? Infinity : Math.round(referenceValue * z.maxPct),
    label: z.maxPct === Infinity
      ? `>${Math.round(referenceValue * z.minPct)}W`
      : `${Math.round(referenceValue * z.minPct)}-${Math.round(referenceValue * z.maxPct)}W`,
  }));
}
```

---

## Apéndice: Mapeo de Objetivos (Label → Key)

```typescript
// Reutilizar GOALS de packages/shared/src/constants/goals.ts
// Mapeo para mostrar labels legibles en la UI:
export const GOAL_LABELS: Record<GoalType, string> = {
  performance: 'Rendimiento',
  health: 'Salud',
  weight_loss: 'Perder peso',
  recovery: 'Recuperación',
};
```
