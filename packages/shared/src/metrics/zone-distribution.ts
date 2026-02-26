import type { TrackPoint } from "./types.js";
import type { ZoneDefinition } from "../constants/zones.js";

/** Resultado de distribución de tiempo en una zona */
export interface ZoneTimeDistribution {
  zone: string;
  name: string;
  seconds: number;
  percentage: number;
  color: string;
}

/**
 * Distribución de tiempo en zonas de potencia.
 * Cada punto resampleado a 1Hz = 1 segundo.
 * Retorna array vacío si no hay datos de potencia o FTP.
 */
export function powerZoneDistribution(
  points: TrackPoint[],
  ftp: number | null,
  zones: readonly ZoneDefinition[],
): ZoneTimeDistribution[] {
  if (ftp === null || ftp <= 0 || zones.length === 0) return [];

  const pointsWithPower = points.filter((p) => p.power !== null);
  if (pointsWithPower.length === 0) return [];

  const totalSeconds = pointsWithPower.length;
  const zoneCounts = new Map<string, number>();

  for (const zone of zones) {
    zoneCounts.set(zone.zone, 0);
  }

  for (const point of pointsWithPower) {
    const ratio = (point.power as number) / ftp;
    const zone = findZone(ratio, zones);
    if (zone) {
      zoneCounts.set(zone.zone, (zoneCounts.get(zone.zone) ?? 0) + 1);
    }
  }

  return zones.map((z) => {
    const seconds = zoneCounts.get(z.zone) ?? 0;
    return {
      zone: z.zone,
      name: z.name,
      seconds,
      percentage: totalSeconds > 0 ? Math.round((seconds / totalSeconds) * 10000) / 100 : 0,
      color: z.color,
    };
  });
}

/**
 * Distribución de tiempo en zonas de frecuencia cardíaca.
 * Retorna array vacío si no hay datos de FC o maxHr.
 */
export function hrZoneDistribution(
  points: TrackPoint[],
  maxHr: number | null,
  zones: readonly ZoneDefinition[],
): ZoneTimeDistribution[] {
  if (maxHr === null || maxHr <= 0 || zones.length === 0) return [];

  const pointsWithHr = points.filter((p) => p.hr !== null);
  if (pointsWithHr.length === 0) return [];

  const totalSeconds = pointsWithHr.length;
  const zoneCounts = new Map<string, number>();

  for (const zone of zones) {
    zoneCounts.set(zone.zone, 0);
  }

  for (const point of pointsWithHr) {
    const ratio = (point.hr as number) / maxHr;
    const zone = findZone(ratio, zones);
    if (zone) {
      zoneCounts.set(zone.zone, (zoneCounts.get(zone.zone) ?? 0) + 1);
    }
  }

  return zones.map((z) => {
    const seconds = zoneCounts.get(z.zone) ?? 0;
    return {
      zone: z.zone,
      name: z.name,
      seconds,
      percentage: totalSeconds > 0 ? Math.round((seconds / totalSeconds) * 10000) / 100 : 0,
      color: z.color,
    };
  });
}

/** Encuentra la zona que corresponde a un ratio dado */
function findZone(ratio: number, zones: readonly ZoneDefinition[]): ZoneDefinition | undefined {
  for (const zone of zones) {
    if (ratio >= zone.minPct && ratio < zone.maxPct) {
      return zone;
    }
  }
  // Si ratio >= maxPct de la última zona (Infinity), cae en la última
  if (zones.length > 0 && ratio >= zones[zones.length - 1].minPct) {
    return zones[zones.length - 1];
  }
  return zones[0];
}
