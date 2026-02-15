# L2 — Bloque 7: Import / Upload de archivos .fit/.gpx

## Contexto

El frontend ya tiene una pantalla de importación (`/activities/import`) con dos modos:
- **Manual**: Funcional — inserta directamente en Supabase desde el cliente
- **Archivo**: Placeholder — muestra UI pero no procesa archivos

Este bloque implementa el backend para el modo archivo: recibir un archivo `.fit` o `.gpx`,
parsearlo, extraer métricas, crear la actividad y guardar las series temporales.

## Endpoint

```
POST /api/v1/activities/upload
Content-Type: multipart/form-data

Fields:
  file: archivo .fit o .gpx (max 10MB)
  name?: string (opcional, se genera desde el archivo si no se proporciona)
  type?: activity_type (opcional, default "endurance")
  rpe?: number 1-10 (opcional)
  notes?: string (opcional)
```

### Response 201
```json
{
  "data": {
    "id": "uuid",
    "name": "Morning Ride",
    "date": "2026-02-15",
    "type": "endurance",
    "duration_seconds": 3600,
    "distance_km": 45.2,
    "avg_power_watts": 205,
    "avg_hr_bpm": 148,
    "max_hr_bpm": 178,
    "avg_cadence_rpm": 88,
    "tss": 68,
    "metrics_count": 3600
  }
}
```

## Decisiones Arquitectónicas

| Decisión | Elección | Rationale |
|----------|----------|-----------|
| Multipart | `@fastify/multipart` | Plugin oficial Fastify |
| Parser .fit | `fit-file-parser` v2.x | Nativo TS, API async |
| Parser .gpx | `@we-gold/gpxjs` + `@xmldom/xmldom` | Nativo TS, GPX completo |
| Tamaño máx | 10 MB | Suficiente para archivos de actividad |
| Métricas | Batch insert | Una sola query para todas las series temporales |
| Storage | No en esta fase | `raw_file_url` queda null — se puede añadir después |

## Flujo

1. Recibir multipart file
2. Validar extensión (.fit o .gpx) y tamaño
3. Parsear archivo con el parser correspondiente
4. Extraer datos de sesión: fecha, duración, distancia, métricas medias/máximas
5. Extraer series temporales: power, hr, cadence, speed por segundo
6. Crear actividad via `createActivity()` (reutiliza cálculo de TSS)
7. Insertar métricas en `activity_metrics` (batch)
8. Retornar actividad + count de métricas

## Archivos

| Archivo | Acción |
|---------|--------|
| `apps/api/src/services/import.service.ts` | Crear — parseo + procesado |
| `apps/api/src/routes/activities.ts` | Modificar — añadir POST upload |
| `apps/api/src/app.ts` | Modificar — registrar @fastify/multipart |
| `apps/api/src/services/import.service.test.ts` | Crear — tests unitarios |
| `apps/api/src/routes/routes.integration.test.ts` | Modificar — tests upload |

## Tests

- parseFitBuffer: extrae sesión y records correctamente
- parseGpxString: extrae track points y métricas
- processUpload: crea actividad + inserta métricas
- Errores: archivo vacío, formato inválido, archivo demasiado grande
- Integración: POST upload → 201, sin archivo → 400, sin auth → 401
