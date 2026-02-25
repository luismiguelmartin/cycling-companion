# Spec Fase 3: Backfill + UI Perfil — Integración Frontend

**PRD**: `docs/PRD-STRAVA-API.md`
**Prioridad**: P1 (Importante)
**Estimación**: ~15 tests nuevos (frontend) + ajustes UI
**Dependencias**: Fase 1 (OAuth) + Fase 2 (webhook + sync)

---

## Objetivo

Implementar la interfaz de usuario completa para la integración con Strava: sección de sincronización en el perfil (conectar/desconectar/importar historial), feedback visual de procesos, badge de origen en actividades, y manejo de query params post-OAuth.

---

## Orden de Implementación

```
1. Componente StravaConnect (Client Component)
2. Modificar profile-content.tsx (reemplazar sección Dispositivos)
3. Hook de query params para feedback post-OAuth
4. Badge de origen en lista de actividades
5. Página de setup Strava (documentación)
6. Tests
```

---

## 3.1 — Componente: `apps/web/src/components/strava-connect.tsx`

### Tipo: Client Component

### Props

```typescript
interface StravaConnectProps {
  initialStatus: StravaConnectionStatus;
}
```

### Estados internos

```typescript
const [status, setStatus] = useState<StravaConnectionStatus>(initialStatus);
const [isConnecting, setIsConnecting] = useState(false);
const [isSyncing, setIsSyncing] = useState(false);
const [isDisconnecting, setIsDisconnecting] = useState(false);
const [syncResult, setSyncResult] = useState<StravaSyncResult | null>(null);
const [error, setError] = useState<string | null>(null);
```

### Renderizado: Estado Desconectado

```
┌──────────────────────────────────────────────────────────────┐
│  [Link2 icon]  Sincronización                                │
│  Conecta tu cuenta de Strava para sincronizar actividades    │
│  automáticamente                                              │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  [Strava SVG icon]  Conectar con Strava                │  │
│  │  Botón: bg-[#FC4C02] hover:bg-[#E34402] text-white    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  También puedes importar archivos .fit/.gpx                   │
│  desde Actividades → Importar                                 │
└──────────────────────────────────────────────────────────────┘
```

### Renderizado: Estado Conectado

```
┌──────────────────────────────────────────────────────────────┐
│  [Link2 icon]  Sincronización                                │
│  Tu cuenta de Strava está conectada                          │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  [CheckCircle icon]                                    │  │
│  │  Conectado como "Luis Martin"                          │  │
│  │  Última sync: hace 2 horas                             │  │
│  │  Actividades importadas: 24                            │  │
│  │                                                        │  │
│  │  ┌────────────────┐   ┌──────────────────────────┐    │  │
│  │  │ Importar hist. │   │ Desconectar              │    │  │
│  │  │ (outline btn)  │   │ (ghost btn, text-muted)  │    │  │
│  │  └────────────────┘   └──────────────────────────┘    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  Las nuevas actividades se importan automáticamente           │
│  cuando las subas a Strava                                    │
│                                                               │
│  ── Powered by Strava ──                                      │
└──────────────────────────────────────────────────────────────┘
```

### Renderizado: Estado Syncing

```
┌────────────────────────────────────────────────────────────────┐
│  [Loader2 icon spinning]  Importando actividades de Strava...  │
│                                                                 │
│  Importadas: 5 / ~30                                            │
│  (Nota: el conteo real se actualiza al finalizar)              │
└────────────────────────────────────────────────────────────────┘
```

### Renderizado: Sync Result (transitorio, 10s)

```
┌────────────────────────────────────────────────────────────┐
│  [CheckCircle icon]  Importación completada                │
│  12 actividades importadas, 18 ya existentes               │
└────────────────────────────────────────────────────────────┘
```

### Acciones

**Conectar**:
1. `setIsConnecting(true)`
2. `GET /api/v1/strava/auth-url` via `apiClientFetch`
3. `window.location.href = url` (redirect al OAuth de Strava)

**Importar historial**:
1. `setIsSyncing(true)`, `setSyncResult(null)`, `setError(null)`
2. `POST /api/v1/strava/sync` con `{ count: 30 }` via `apiClientPost`
3. `setSyncResult(result)`, `setIsSyncing(false)`
4. Refrescar status: `GET /api/v1/strava/status`
5. Auto-ocultar syncResult después de 10 segundos

**Desconectar**:
1. Mostrar diálogo de confirmación (window.confirm o custom modal)
   - "¿Desconectar Strava? Las actividades ya importadas permanecerán."
2. Si confirma: `setIsDisconnecting(true)`
3. `DELETE /api/v1/strava/disconnect` via `apiClientDelete`
4. `setStatus({ connected: false, ... })`, `setIsDisconnecting(false)`

### Estilos

- Card: `rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 md:p-5`
- Botón Strava: `bg-[#FC4C02] hover:bg-[#E34402] text-white font-semibold rounded-xl px-6 py-3`
- Botón importar: `border border-[var(--card-border)] text-[var(--text-primary)] rounded-xl px-4 py-2`
- Botón desconectar: `text-[var(--text-muted)] text-[13px] hover:text-red-500`
- "Powered by Strava": `text-[11px] text-[var(--text-muted)]` centrado

### Iconos (Lucide React)

- Sincronización: `Link2`
- Conectado: `CheckCircle2`
- Importar: `Download`
- Desconectar: `Unlink`
- Loading: `Loader2` (con `animate-spin`)
- Strava logo: SVG inline (requerido por Brand Guidelines)

---

## 3.2 — Modificar Perfil: `apps/web/src/app/(app)/profile/profile-content.tsx`

### Cambios en la sección "Ajustes"

**Eliminar**: La sección "Dispositivos" completa (array de Garmin/Strava/Wahoo con estado "Próximamente")

**Reemplazar por**: El componente `<StravaConnect>` recibiendo el status como prop

### Flujo de datos

1. **Server Component** (`page.tsx`): Fetch `GET /strava/status` junto con el perfil
2. Pasar `stravaStatus` como prop a `ProfileContent`
3. `ProfileContent` pasa `stravaStatus` a `<StravaConnect>`

### Modificar `page.tsx`

```typescript
// En el Server Component
const [profile, stravaStatus] = await Promise.all([
  apiGet<{ data: UserProfile }>("/profile", token),
  apiGet<{ data: StravaConnectionStatus }>("/strava/status", token).catch(() => ({
    data: {
      connected: false,
      athlete_name: null,
      strava_athlete_id: null,
      connected_at: null,
      last_sync_at: null,
      activities_count: 0,
    },
  })),
]);
```

**Nota**: El try/catch en stravaStatus sigue el patrón de resiliencia SSR del proyecto. Si la API de Strava no está configurada, el componente muestra estado desconectado.

### Modificar `ProfileContentProps`

```typescript
interface ProfileContentProps {
  profile: { /* ... existente ... */ };
  stravaStatus: StravaConnectionStatus;
}
```

---

## 3.3 — Feedback Post-OAuth: Query Params

### Flujo

1. Después del callback OAuth, el backend redirige a `/profile?strava=connected` o `/profile?strava=error&reason=...`
2. El componente `ProfileContent` (o `StravaConnect`) lee los query params
3. Muestra un toast/banner temporal:
   - `strava=connected` → Toast éxito: "Cuenta de Strava conectada correctamente"
   - `strava=error&reason=invalid_state` → Toast error: "Error de autenticación. Intenta de nuevo."
   - `strava=error&reason=insufficient_scope` → Toast error: "Permisos insuficientes. Asegúrate de aceptar todos los permisos."
   - `strava=error&reason=already_connected` → Toast error: "Esta cuenta de Strava ya está vinculada a otro usuario."
   - `strava=error&reason=exchange_failed` → Toast error: "Error al conectar con Strava. Intenta de nuevo."
4. Limpiar query params de la URL (usando `router.replace("/profile")`)

### Implementación

- Usar `useSearchParams()` de Next.js
- Mostrar toast durante 5 segundos
- Estilo toast éxito: `border-green-500/30 bg-green-500/[0.08] text-green-500`
- Estilo toast error: `border-red-500/30 bg-red-500/[0.08] text-red-500`

---

## 3.4 — Badge de Origen en Actividades

### Lista de actividades: `apps/web/src/app/(app)/activities/`

En cada card de actividad, si `source === "strava"`, mostrar un badge pequeño:

```
┌──────────────────────────────────────────────┐
│  Ruta por la sierra            [badge Strava]│
│  25 Feb · 45.2 km · 1h30m                   │
│  ⚡ 185W  ❤️ 142 bpm                        │
└──────────────────────────────────────────────┘
```

Badge: `text-[10px] bg-[#FC4C02]/10 text-[#FC4C02] rounded px-1.5 py-0.5`

### Detalle de actividad: `apps/web/src/app/(app)/activities/[id]/`

En el header de la actividad, mostrar la fuente:
- `source === "strava"` → "Importada desde Strava" con link a la actividad original: `https://www.strava.com/activities/${strava_id}`
- `source === "upload"` → "Importada desde archivo"
- `source === "manual"` → No mostrar nada (es el default)

---

## 3.5 — Logo SVG de Strava

### Archivo: `apps/web/src/components/icons/strava-logo.tsx`

Componente React con el logo oficial de Strava (SVG). Requerido por las Brand Guidelines.

```typescript
interface StravaLogoProps {
  className?: string;
  size?: number;
}

export function StravaLogo({ className, size = 20 }: StravaLogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-label="Strava"
    >
      {/* SVG path del logo oficial de Strava */}
    </svg>
  );
}
```

**Nota**: El SVG exacto debe descargarse de las Brand Guidelines oficiales de Strava.

---

## 3.6 — Documentación de Setup: `docs/STRAVA-SETUP.md`

Crear un documento con instrucciones para:

1. **Crear app en Strava**: URL, campos necesarios, screenshot
2. **Configurar variables de entorno**: lista completa con ejemplos
3. **Registrar webhook**: comando curl exacto
4. **Verificar webhook**: cómo comprobar que funciona
5. **Proceso de aprobación multi-user**: cuando solicitar, qué incluir
6. **Generar clave de cifrado**: comando para generar `STRAVA_TOKEN_ENCRYPTION_KEY`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
7. **Troubleshooting**: errores comunes y soluciones

---

## 3.7 — Actualizar `activitySchema` en Frontend

El frontend necesita conocer los nuevos campos `source` y `strava_id` que llegan de la API.

### Modificar tipos en componentes

Los componentes que renderizan actividades (`ActivityCard`, `ActivityDetail`, etc.) deben aceptar los nuevos campos opcionales sin romperse:

```typescript
// Ya cubierto por activitySchema actualizado en Fase 0
// Solo asegurarse de que los componentes lean `source` y `strava_id`
```

---

## Tests

### Componente: StravaConnect

| Test | Escenario | Expected |
|------|-----------|----------|
| Render desconectado | `connected: false` | Muestra botón "Conectar con Strava" |
| Render conectado | `connected: true, athlete_name: "Luis"` | Muestra nombre, last_sync, count |
| Click conectar | Desconectado + click | Llama GET /strava/auth-url y navega |
| Click importar historial | Conectado + click | Llama POST /strava/sync, muestra spinner |
| Sync result | Tras sync exitoso | Muestra "12 importadas, 18 ya existentes" |
| Click desconectar | Confirma + click | Llama DELETE /strava/disconnect |
| Desconectar cancelado | Cancela confirmación | No llama API |
| Error en sync | API devuelve error | Muestra mensaje de error |
| Loading states | Durante llamadas API | Botones deshabilitados, spinners visibles |

### Feedback post-OAuth

| Test | Escenario | Expected |
|------|-----------|----------|
| ?strava=connected | Query param presente | Toast éxito visible |
| ?strava=error&reason=invalid_state | Error param | Toast error con mensaje |
| Sin query params | URL limpia | Sin toast |
| Limpieza de URL | Tras mostrar toast | Query params eliminados |

### Badge de origen

| Test | Escenario | Expected |
|------|-----------|----------|
| source: "strava" | En lista | Badge naranja "Strava" visible |
| source: "manual" | En lista | Sin badge |
| source: "upload" | En lista | Sin badge (o badge discreto "Archivo") |
| Detalle strava | source: "strava" + strava_id | Link a strava.com visible |

---

## Archivos a Crear/Modificar

| # | Archivo | Acción |
|---|---------|--------|
| 1 | `apps/web/src/components/strava-connect.tsx` | Crear |
| 2 | `apps/web/src/components/icons/strava-logo.tsx` | Crear |
| 3 | `apps/web/src/app/(app)/profile/profile-content.tsx` | Modificar (reemplazar Dispositivos) |
| 4 | `apps/web/src/app/(app)/profile/page.tsx` | Modificar (fetch stravaStatus) |
| 5 | `apps/web/src/app/(app)/activities/` | Modificar (badge source) |
| 6 | `apps/web/src/app/(app)/activities/[id]/` | Modificar (origen + link Strava) |
| 7 | `docs/STRAVA-SETUP.md` | Crear |
| 8 | `apps/web/src/components/strava-connect.test.tsx` | Crear |

---

## Consideraciones de UX

### Tiempo de respuesta

- **Conectar**: Redirect instantáneo (< 1s local → Strava OAuth → callback → redirect)
- **Importar historial**: Puede tardar 30-60 segundos para 30 actividades. Mostrar progreso.
- **Webhook sync**: Invisible para el usuario. Actividad aparece en la lista al refrescar.

### Mobile

- El botón "Conectar con Strava" debe ser full-width en mobile
- Los botones "Importar historial" y "Desconectar" deben apilarse verticalmente en pantallas pequeñas

### Accesibilidad

- Botón Strava: `aria-label="Conectar con Strava"`
- Status: `role="status"` para anunciar cambios
- Loading: `aria-busy="true"` durante operaciones
- Toast: `role="alert"` para feedback post-OAuth

### Datos vacíos

- Si `last_sync_at` es null: mostrar "Nunca sincronizado" en lugar de fecha
- Si `activities_count` es 0: mostrar "Sin actividades importadas"

### Error recovery

- Si la API falla al cargar stravaStatus: mostrar estado desconectado (fallback seguro)
- Si el sync falla a mitad: mostrar resultado parcial + mensaje de error
- Botón "Reintentar" visible en caso de error
