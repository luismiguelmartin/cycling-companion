import { computeActivitySummary, type ActivitySummary } from "shared";
import { supabaseAdmin } from "../supabase.js";
import { createActivity } from "../activity.service.js";
import { getProfile } from "../profile.service.js";
import { analyzeActivity } from "../ai/ai.service.js";
import { AppError } from "../../plugins/error-handler.js";
import {
  getValidAccessToken,
  getStravaActivity,
  getStravaActivityStreams,
  listStravaActivities,
  getStravaConnectionByAthleteId,
  deleteStravaConnection,
  updateLastSyncAt,
  StravaRateLimitError,
} from "./index.js";
import { isStravaCyclingActivity, mapStravaToActivity } from "./strava-mapper.service.js";
import type { StravaWebhookEvent } from "./types.js";

const MAX_METRICS = 100_000;
const BATCH_SIZE = 1000;

/**
 * Importa una actividad individual desde Strava.
 * @returns activityId si se importó, null si se saltó (no es ciclismo o ya existe)
 */
export async function importStravaActivity(
  userId: string,
  stravaActivityId: number,
  options?: { skipAiAnalysis?: boolean },
): Promise<string | null> {
  // 1. Verificar que no exista ya
  const { data: existing } = await supabaseAdmin
    .from("activities")
    .select("id")
    .eq("strava_id", stravaActivityId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return null;

  // 2. Obtener access token válido
  const accessToken = await getValidAccessToken(userId);

  // 3. Fetch detalle de actividad
  const stravaActivity = await getStravaActivity(accessToken, stravaActivityId);

  // 4. Verificar que sea ciclismo
  if (!isStravaCyclingActivity(stravaActivity.sport_type)) {
    return null;
  }

  // 5. Fetch streams (best-effort, continuar sin ellos si falla)
  let streams = null;
  try {
    streams = await getStravaActivityStreams(accessToken, stravaActivityId);
  } catch {
    // Actividad sin streams (manual, indoor sin sensor, etc.)
  }

  // 6. Mapear a nuestro formato
  const { activityData, trackPoints, metrics } = mapStravaToActivity(stravaActivity, streams);

  // 7. Obtener perfil del usuario (para FTP, max_hr)
  const profile = await getProfile(userId);

  // 8. Computar métricas avanzadas si hay trackPoints
  let summary: ActivitySummary | undefined;
  if (trackPoints.length > 0) {
    summary = computeActivitySummary(trackPoints, profile.ftp ?? null, profile.max_hr ?? null);
  }

  // 9. Crear actividad en BD
  const { strava_id, source, ...createData } = activityData;
  const activity = await createActivity(
    userId,
    {
      ...createData,
      distance_km:
        summary?.distance_km && summary.distance_km > 0
          ? Math.round(summary.distance_km * 100) / 100
          : createData.distance_km,
      avg_power_watts:
        summary?.avg_power != null ? Math.round(summary.avg_power) : createData.avg_power_watts,
      avg_hr_bpm: summary?.avg_hr != null ? Math.round(summary.avg_hr) : createData.avg_hr_bpm,
      max_hr_bpm: summary?.max_hr != null ? Math.round(summary.max_hr) : createData.max_hr_bpm,
      rpe: null,
      notes: null,
    },
    profile.ftp,
    summary?.normalized_power ?? null,
    summary,
    { strava_id, source },
  );

  // 10. Insertar series temporales en activity_metrics
  if (metrics.length > 0 && metrics.length <= MAX_METRICS) {
    const metricsRows = metrics.map((m, i) => ({
      activity_id: activity.id,
      timestamp_seconds: m.timestampSeconds,
      power_watts: m.powerWatts,
      hr_bpm: m.hrBpm,
      cadence_rpm: m.cadenceRpm,
      speed_kmh: m.speedKmh,
      lat: trackPoints[i]?.lat ?? null,
      lon: trackPoints[i]?.lon ?? null,
      elevation: trackPoints[i]?.elevation ?? null,
    }));

    for (let i = 0; i < metricsRows.length; i += BATCH_SIZE) {
      const batch = metricsRows.slice(i, i + BATCH_SIZE);
      const { error } = await supabaseAdmin.from("activity_metrics").insert(batch);
      if (error) {
        throw new AppError(`Error al guardar métricas: ${error.message}`, 500, "DATABASE_ERROR");
      }
    }
  }

  // 11. Trigger análisis IA (si no es backfill)
  if (!options?.skipAiAnalysis) {
    analyzeActivity(userId, activity.id).catch(() => {});
  }

  // 12. Actualizar last_sync_at
  await updateLastSyncAt(userId);

  return activity.id;
}

/**
 * Procesa un evento de webhook de Strava.
 * Idempotente: errores se loguean pero no se relanzan.
 */
export async function processWebhookEvent(event: StravaWebhookEvent): Promise<void> {
  // Deauthorize: usuario revocó acceso desde Strava
  if (event.object_type === "athlete" && event.updates?.authorized === "false") {
    const connection = await getStravaConnectionByAthleteId(event.owner_id);
    if (connection) {
      await deleteStravaConnection(connection.user_id);
    }
    return;
  }

  // Solo procesar creación de actividades
  if (event.object_type !== "activity" || event.aspect_type !== "create") {
    return;
  }

  // Buscar conexión por strava_athlete_id
  const connection = await getStravaConnectionByAthleteId(event.owner_id);
  if (!connection) {
    return;
  }

  // Importar actividad
  await importStravaActivity(connection.user_id, event.object_id);
}

/**
 * Importa múltiples actividades históricas (backfill).
 * @returns Contadores de importadas, saltadas, errores
 */
export async function backfillStravaActivities(
  userId: string,
  options?: { count?: number; after?: number },
): Promise<{ imported: number; skipped: number; errors: number }> {
  const count = options?.count ?? 30;
  const accessToken = await getValidAccessToken(userId);

  // Listar actividades de Strava
  const stravaActivities = await listStravaActivities(accessToken, {
    perPage: count,
    page: 1,
    after: options?.after,
  });

  // Filtrar solo ciclismo
  const cyclingActivities = stravaActivities.filter((a) => isStravaCyclingActivity(a.sport_type));

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  // Importar secuencialmente para respetar rate limits
  for (const activity of cyclingActivities) {
    try {
      const result = await importStravaActivity(userId, activity.id, { skipAiAnalysis: true });
      if (result) {
        imported++;
      } else {
        skipped++;
      }
    } catch (err) {
      if (err instanceof StravaRateLimitError) {
        errors++;
        break; // Parar backfill si hit rate limit
      }
      errors++;
    }
  }

  // Contar no-ciclismo como skipped
  skipped += stravaActivities.length - cyclingActivities.length;

  if (imported > 0) {
    await updateLastSyncAt(userId).catch(() => {});
  }

  return { imported, skipped, errors };
}
