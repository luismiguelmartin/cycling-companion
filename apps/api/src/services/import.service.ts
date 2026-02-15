import FitParser from "fit-file-parser";
import { parseGPXWithCustomParser } from "@we-gold/gpxjs";
import { DOMParser } from "linkedom";
import { calculateNP, type ActivityType } from "shared";
import { supabaseAdmin } from "./supabase.js";
import { createActivity } from "./activity.service.js";
import { getProfile } from "./profile.service.js";
import { analyzeActivity } from "./ai/ai.service.js";
import { AppError } from "../plugins/error-handler.js";

/** Datos extraídos del parseo de un archivo .fit o .gpx */
export interface ParsedActivityData {
  name: string;
  date: string;
  durationSeconds: number;
  distanceKm: number | null;
  avgPowerWatts: number | null;
  normalizedPowerWatts: number | null;
  avgHrBpm: number | null;
  maxHrBpm: number | null;
  avgCadenceRpm: number | null;
  metrics: ParsedMetric[];
}

export interface ParsedMetric {
  timestampSeconds: number;
  powerWatts: number | null;
  hrBpm: number | null;
  cadenceRpm: number | null;
  speedKmh: number | null;
}

/**
 * Busca un valor numérico en extensiones GPX, soportando múltiples formatos:
 * - Top-level: ext[key]
 * - Garmin TrackPointExtension: ext["gpxtpx:TrackPointExtension"]["gpxtpx:key"]
 */
export function extractFromExtensions(
  ext: Record<string, unknown>,
  ...keys: string[]
): number | null {
  for (const key of keys) {
    if (ext[key] != null) return Number(ext[key]);
    const tpe = ext["gpxtpx:TrackPointExtension"];
    if (tpe && typeof tpe === "object") {
      const tpeObj = tpe as Record<string, unknown>;
      if (tpeObj[key] != null) return Number(tpeObj[key]);
      if (tpeObj[`gpxtpx:${key}`] != null) return Number(tpeObj[`gpxtpx:${key}`]);
    }
  }
  return null;
}

/**
 * Calcula NP a partir de un array de métricas parseadas.
 */
function computeNP(metrics: ParsedMetric[]): number | null {
  const powerSamples = metrics.filter((m) => m.powerWatts != null).map((m) => m.powerWatts!);
  if (powerSamples.length === 0) return null;
  const sampleInterval =
    metrics.length >= 2
      ? Math.max(
          1,
          Math.round(
            (metrics[metrics.length - 1].timestampSeconds - metrics[0].timestampSeconds) /
              metrics.length,
          ),
        )
      : 1;
  return calculateNP(powerSamples, sampleInterval);
}

/**
 * Parsea un buffer de archivo .fit y extrae datos de actividad + métricas.
 */
export async function parseFitBuffer(buffer: Buffer): Promise<ParsedActivityData> {
  const parser = new FitParser({ force: true, speedUnit: "km/h", lengthUnit: "km" });

  let fit;
  try {
    fit = await parser.parseAsync(buffer as Buffer<ArrayBuffer>);
  } catch {
    throw new AppError("Error al parsear archivo .fit", 400, "INVALID_FILE");
  }

  const session = fit.sessions?.[0];
  const records = fit.records ?? [];

  if (!session) {
    throw new AppError("Archivo .fit sin datos de sesión", 400, "INVALID_FILE");
  }

  const startTime = new Date(session.start_time);
  const date = startTime.toISOString().slice(0, 10);
  const durationSeconds = Math.round(session.total_timer_time ?? session.total_elapsed_time ?? 0);

  // Distancia: total_distance viene en km si lengthUnit='km'
  const distanceKm = session.total_distance ? Math.round(session.total_distance * 100) / 100 : null;

  const avgPowerWatts = session.avg_power ? Math.round(session.avg_power) : null;
  const avgHrBpm = session.avg_heart_rate ? Math.round(session.avg_heart_rate) : null;
  const maxHrBpm = session.max_heart_rate ? Math.round(session.max_heart_rate) : null;
  const avgCadenceRpm = session.avg_cadence ? Math.round(session.avg_cadence) : null;

  // Extraer métricas segundo a segundo de los records
  const metrics: ParsedMetric[] = [];
  const baseTimestamp = records[0]?.timestamp ? new Date(records[0].timestamp).getTime() : 0;

  for (const record of records) {
    if (!record.timestamp) continue;
    const recordTime = new Date(record.timestamp).getTime();
    const timestampSeconds = Math.round((recordTime - baseTimestamp) / 1000);

    metrics.push({
      timestampSeconds,
      powerWatts: record.power ?? null,
      hrBpm: record.heart_rate ?? null,
      cadenceRpm: record.cadence ?? null,
      speedKmh: record.speed ? Math.round(record.speed * 100) / 100 : null,
    });
  }

  return {
    name: `Actividad ${date}`,
    date,
    durationSeconds,
    distanceKm,
    avgPowerWatts,
    normalizedPowerWatts: computeNP(metrics),
    avgHrBpm,
    maxHrBpm,
    avgCadenceRpm,
    metrics,
  };
}

/**
 * Parsea un string XML de archivo .gpx y extrae datos de actividad + métricas.
 */
export function parseGpxString(xmlString: string): ParsedActivityData {
  const customParser = (txt: string) => new DOMParser().parseFromString(txt, "text/xml");

  const [parsed, error] = parseGPXWithCustomParser(xmlString, customParser, {
    removeEmptyFields: true,
    avgSpeedThreshold: 0.1,
  });

  if (error || !parsed) {
    throw new AppError("Error al parsear archivo .gpx", 400, "INVALID_FILE");
  }

  const track = parsed.tracks[0];
  if (!track || track.points.length === 0) {
    throw new AppError("Archivo .gpx sin datos de track", 400, "INVALID_FILE");
  }

  const startTime = track.points[0].time ?? new Date();
  const date = new Date(startTime).toISOString().slice(0, 10);
  const durationSeconds = Math.round(track.duration.movingDuration || track.duration.totalDuration);
  const distanceKm = track.distance.total
    ? Math.round((track.distance.total / 1000) * 100) / 100
    : null;

  // Calcular medias desde los puntos
  let totalPower = 0;
  let powerCount = 0;
  let totalHr = 0;
  let hrCount = 0;
  let maxHr = 0;
  let totalCadence = 0;
  let cadenceCount = 0;

  const baseTime = track.points[0].time ? new Date(track.points[0].time).getTime() : 0;

  const metrics: ParsedMetric[] = [];

  for (const point of track.points) {
    const ext = point.extensions;
    const power = ext ? extractFromExtensions(ext, "power", "watts") : null;
    const hr = ext ? extractFromExtensions(ext, "hr", "heartRate", "heart_rate") : null;
    const cadence = ext ? extractFromExtensions(ext, "cad", "cadence") : null;
    const speed = ext ? extractFromExtensions(ext, "speed") : null;

    if (power != null && !isNaN(power)) {
      totalPower += power;
      powerCount++;
    }
    if (hr != null && !isNaN(hr)) {
      totalHr += hr;
      hrCount++;
      if (hr > maxHr) maxHr = hr;
    }
    if (cadence != null && !isNaN(cadence)) {
      totalCadence += cadence;
      cadenceCount++;
    }

    const pointTime = point.time ? new Date(point.time).getTime() : 0;
    const timestampSeconds = baseTime ? Math.round((pointTime - baseTime) / 1000) : 0;

    metrics.push({
      timestampSeconds,
      powerWatts: power,
      hrBpm: hr,
      cadenceRpm: cadence,
      speedKmh: speed ? Math.round(speed * 3.6 * 100) / 100 : null,
    });
  }

  return {
    name: track.name ?? `Actividad ${date}`,
    date,
    durationSeconds,
    distanceKm,
    avgPowerWatts: powerCount > 0 ? Math.round(totalPower / powerCount) : null,
    normalizedPowerWatts: computeNP(metrics),
    avgHrBpm: hrCount > 0 ? Math.round(totalHr / hrCount) : null,
    maxHrBpm: maxHr > 0 ? Math.round(maxHr) : null,
    avgCadenceRpm: cadenceCount > 0 ? Math.round(totalCadence / cadenceCount) : null,
    metrics,
  };
}

/**
 * Procesa el upload completo: parsea archivo, crea actividad, inserta métricas.
 */
export async function processUpload(
  userId: string,
  fileBuffer: Buffer,
  fileName: string,
  overrides?: {
    name?: string;
    type?: ActivityType;
    rpe?: number;
    notes?: string;
  },
): Promise<{ activityId: string; metricsCount: number }> {
  const ext = fileName.toLowerCase().split(".").pop();

  let parsed: ParsedActivityData;
  if (ext === "fit") {
    parsed = await parseFitBuffer(fileBuffer);
  } else if (ext === "gpx") {
    parsed = parseGpxString(fileBuffer.toString("utf-8"));
  } else {
    throw new AppError("Formato no soportado. Usa .fit o .gpx", 400, "UNSUPPORTED_FORMAT");
  }

  if (parsed.durationSeconds <= 0) {
    throw new AppError("El archivo no contiene datos de duración válidos", 400, "INVALID_FILE");
  }

  // Obtener FTP del usuario para calcular TSS
  const profile = await getProfile(userId);

  const activity = await createActivity(
    userId,
    {
      name: overrides?.name || parsed.name,
      date: parsed.date,
      type: overrides?.type ?? "endurance",
      duration_seconds: parsed.durationSeconds,
      distance_km: parsed.distanceKm,
      avg_power_watts: parsed.avgPowerWatts,
      avg_hr_bpm: parsed.avgHrBpm,
      max_hr_bpm: parsed.maxHrBpm,
      avg_cadence_rpm: parsed.avgCadenceRpm,
      rpe: overrides?.rpe ?? null,
      notes: overrides?.notes ?? null,
    },
    profile.ftp,
    parsed.normalizedPowerWatts,
  );

  // Insertar métricas en batch (si hay)
  let metricsCount = 0;
  if (parsed.metrics.length > 0) {
    const metricsRows = parsed.metrics.map((m) => ({
      activity_id: activity.id,
      timestamp_seconds: m.timestampSeconds,
      power_watts: m.powerWatts,
      hr_bpm: m.hrBpm,
      cadence_rpm: m.cadenceRpm,
      speed_kmh: m.speedKmh,
    }));

    // Insertar en bloques de 1000 para evitar límites
    const BATCH_SIZE = 1000;
    for (let i = 0; i < metricsRows.length; i += BATCH_SIZE) {
      const batch = metricsRows.slice(i, i + BATCH_SIZE);
      const { error } = await supabaseAdmin.from("activity_metrics").insert(batch);

      if (error) {
        throw new AppError(`Error al guardar métricas: ${error.message}`, 500, "DATABASE_ERROR");
      }
    }

    metricsCount = metricsRows.length;
  }

  // Fire-and-forget: trigger AI analysis sin bloquear la respuesta
  analyzeActivity(userId, activity.id).catch(() => {
    /* silenciar errores de IA */
  });

  return { activityId: activity.id, metricsCount };
}
