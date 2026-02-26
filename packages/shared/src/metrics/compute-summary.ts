import type { TrackPoint, ActivitySummary } from "./types.js";
import { METRICS_THRESHOLDS } from "./types.js";
import { sanitizeTrackPoints } from "./sanitize.js";
import { sortAndDeduplicate, resampleTo1Hz } from "./resample.js";
import { computeSpeed } from "./speed.js";
import { detectMovement } from "./movement.js";
import {
  avgPower,
  avgPowerNonZero,
  maxPower,
  normalizedPower,
  variabilityIndex,
} from "./power-metrics.js";
import { elevationGain } from "./elevation.js";
import { haversineDistance } from "./haversine.js";
import { powerZoneDistribution, hrZoneDistribution } from "./zone-distribution.js";
import { computeBestEfforts } from "./best-efforts.js";
import { POWER_ZONES, HR_ZONES } from "../constants/zones.js";

/**
 * Pipeline completo: TrackPoint[] -> ActivitySummary.
 *
 * 1. sanitizeTrackPoints() — limpiar aberraciones de sensores
 * 2. sortAndDeduplicate() — ordenar y eliminar duplicados
 * 3. resampleTo1Hz() — interpolar a intervalos de 1 segundo
 * 4. computeSpeed() — calcular velocidad via Haversine
 * 5. detectMovement() — marcar isMoving en cada punto
 * 6. Calcular todas las metricas
 *
 * @param rawPoints - Puntos crudos del parser (.fit/.gpx)
 * @param userFtp - FTP del usuario (null si no configurado)
 * @param userMaxHr - Max HR del usuario (para hrTSS fallback, opcional)
 */
export function computeActivitySummary(
  rawPoints: TrackPoint[],
  userFtp: number | null,
  userMaxHr?: number | null,
): ActivitySummary {
  // Defaults para arrays vacios o sin datos
  if (rawPoints.length === 0) {
    return emptySummary();
  }

  // Pipeline de procesamiento
  const sanitized = sanitizeTrackPoints(rawPoints);
  const sorted = sortAndDeduplicate(sanitized);

  if (sorted.length === 0) {
    return emptySummary();
  }

  const resampled = resampleTo1Hz(sorted);
  const withSpeed = computeSpeed(resampled);
  const processed = detectMovement(withSpeed);

  // Duraciones
  const durationTotal =
    processed.length > 1
      ? Math.round((processed[processed.length - 1].timestamp - processed[0].timestamp) / 1000)
      : 0;
  const durationMoving = processed.filter((p) => p.isMoving === true).length;

  // Distancia (suma de Haversine entre puntos consecutivos en movimiento)
  let distanceM = 0;
  for (let i = 1; i < processed.length; i++) {
    if (processed[i].isMoving === true && processed[i - 1].isMoving === true) {
      distanceM += haversineDistance(
        processed[i - 1].lat,
        processed[i - 1].lon,
        processed[i].lat,
        processed[i].lon,
      );
    }
  }
  const distanceKm = Math.round((distanceM / 1000) * 100) / 100;

  // Velocidad
  const movingHours = durationMoving / 3600;
  const avgSpeed = movingHours > 0 ? Math.round((distanceKm / movingHours) * 100) / 100 : 0;

  const movingPoints = processed.filter((p) => p.isMoving === true);
  const movingSpeeds = movingPoints
    .map((p) => p.speed)
    .filter((s): s is number => s !== undefined && s > 0);
  const maxSpeed = movingSpeeds.length > 0 ? Math.round(Math.max(...movingSpeeds) * 100) / 100 : 0;

  // Metricas de potencia
  const avgPow = avgPower(processed);
  const avgPowNonZero = avgPowerNonZero(processed);
  const maxPow = maxPower(processed);
  const np = normalizedPower(processed);

  const vi =
    np !== null && avgPow !== null && avgPow > 0
      ? Math.round(variabilityIndex(np, avgPow) * 100) / 100
      : null;

  const intensityFactor =
    np !== null && userFtp !== null && userFtp > 0 ? Math.round((np / userFtp) * 100) / 100 : null;

  // TSS
  const tss = computeTSS(np, avgPow, userFtp, durationTotal, processed, userMaxHr);

  // Metricas de FC
  const hrValues = processed.map((p) => p.hr).filter((h): h is number => h !== null);
  const avgHr = hrValues.length > 0 ? Math.round(mean(hrValues)) : null;
  const maxHr = hrValues.length > 0 ? Math.max(...hrValues) : null;

  const movingHrValues = movingPoints.map((p) => p.hr).filter((h): h is number => h !== null);
  const avgHrMoving = movingHrValues.length > 0 ? Math.round(mean(movingHrValues)) : null;

  // Cadencia media en movimiento (excluyendo ceros)
  const movingCadValues = movingPoints
    .map((p) => p.cadence)
    .filter((c): c is number => c !== null && c > 0);
  const avgCadenceMoving = movingCadValues.length > 0 ? Math.round(mean(movingCadValues)) : null;

  // Elevacion
  const elevGain = elevationGain(processed);

  // Fase 3: distribución de zonas y best efforts
  const powerZones = powerZoneDistribution(processed, userFtp, POWER_ZONES);
  const hrZones = hrZoneDistribution(processed, userMaxHr ?? null, HR_ZONES);
  const bestEfforts = computeBestEfforts(processed);

  return {
    duration_total: durationTotal,
    duration_moving: durationMoving,
    distance_km: distanceKm,
    avg_speed: avgSpeed,
    max_speed: maxSpeed,
    avg_power: avgPow !== null ? Math.round(avgPow) : null,
    avg_power_non_zero: avgPowNonZero !== null ? Math.round(avgPowNonZero) : null,
    normalized_power: np,
    variability_index: vi,
    intensity_factor: intensityFactor,
    avg_hr: avgHr,
    avg_hr_moving: avgHrMoving,
    max_hr: maxHr,
    avg_cadence_moving: avgCadenceMoving,
    tss,
    elevation_gain: elevGain,
    max_power: maxPow !== null ? Math.round(maxPow) : null,
    power_zone_distribution: powerZones.length > 0 ? powerZones : null,
    hr_zone_distribution: hrZones.length > 0 ? hrZones : null,
    best_efforts: bestEfforts.length > 0 ? bestEfforts : null,
  };
}

/**
 * Calcula TSS con preferencia: NP-based > avg_power-based > hrTSS fallback.
 */
function computeTSS(
  np: number | null,
  avgPow: number | null,
  userFtp: number | null,
  durationTotalSeconds: number,
  points: TrackPoint[],
  userMaxHr?: number | null,
): number | null {
  // TSS basado en potencia (NP preferido)
  if (userFtp !== null && userFtp > 0) {
    const powerForTSS = np ?? (avgPow !== null ? Math.round(avgPow) : null);
    if (powerForTSS !== null && powerForTSS > 0) {
      // Solo calcular TSS con NP si duracion >= 10 min
      if (np !== null && durationTotalSeconds < METRICS_THRESHOLDS.MIN_DURATION_FOR_NP_SECONDS) {
        // Usar avg_power si la actividad es corta
        if (avgPow !== null && avgPow > 0) {
          const ifAvg = avgPow / userFtp;
          return Math.round(ifAvg * ifAvg * (durationTotalSeconds / 3600) * 100);
        }
        return null;
      }
      const ifValue = powerForTSS / userFtp;
      return Math.round(ifValue * ifValue * (durationTotalSeconds / 3600) * 100);
    }
  }

  // Fallback: hrTSS (sin potenciometro)
  if (userMaxHr != null && userMaxHr > 0) {
    const hrValues = points.map((p) => p.hr).filter((h): h is number => h !== null);
    if (hrValues.length > 0) {
      const avgHr = mean(hrValues);
      const lthr = userMaxHr * 0.85;
      if (lthr > 0) {
        const ifHr = avgHr / lthr;
        return Math.round(ifHr * ifHr * (durationTotalSeconds / 3600) * 100);
      }
    }
  }

  return null;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function emptySummary(): ActivitySummary {
  return {
    duration_total: 0,
    duration_moving: 0,
    distance_km: 0,
    avg_speed: 0,
    max_speed: 0,
    avg_power: null,
    avg_power_non_zero: null,
    normalized_power: null,
    variability_index: null,
    intensity_factor: null,
    avg_hr: null,
    avg_hr_moving: null,
    max_hr: null,
    avg_cadence_moving: null,
    tss: null,
    elevation_gain: null,
    max_power: null,
    power_zone_distribution: null,
    hr_zone_distribution: null,
    best_efforts: null,
  };
}
