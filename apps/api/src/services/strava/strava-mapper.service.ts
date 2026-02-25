import {
  STRAVA_SPORT_TYPE_MAP,
  STRAVA_CYCLING_SPORT_TYPES,
  type ActivityType,
  type TrackPoint,
} from "shared";
import type { ParsedMetric } from "../import.service.js";
import type { StravaDetailedActivity, StravaStreams } from "./types.js";

export interface MappedActivityData {
  name: string;
  date: string;
  type: ActivityType;
  duration_seconds: number;
  distance_km: number | null;
  avg_power_watts: number | null;
  avg_hr_bpm: number | null;
  max_hr_bpm: number | null;
  avg_cadence_rpm: number | null;
  strava_id: number;
  source: "strava";
}

export interface MappedStravaResult {
  activityData: MappedActivityData;
  trackPoints: TrackPoint[];
  metrics: ParsedMetric[];
}

/** Verifica si un sport_type de Strava es ciclismo */
export function isStravaCyclingActivity(sportType: string): boolean {
  return STRAVA_CYCLING_SPORT_TYPES.includes(sportType);
}

/** Mapea datos de Strava (actividad + streams) a nuestro formato de importación */
export function mapStravaToActivity(
  stravaActivity: StravaDetailedActivity,
  streams: StravaStreams | null,
): MappedStravaResult {
  const date = stravaActivity.start_date_local.slice(0, 10);
  const activityType = (STRAVA_SPORT_TYPE_MAP[stravaActivity.sport_type] ??
    "endurance") as ActivityType;

  const activityData: MappedActivityData = {
    name: stravaActivity.name,
    date,
    type: activityType,
    duration_seconds: stravaActivity.moving_time,
    distance_km:
      stravaActivity.distance > 0 ? Math.round((stravaActivity.distance / 1000) * 100) / 100 : null,
    avg_power_watts:
      stravaActivity.average_watts != null ? Math.round(stravaActivity.average_watts) : null,
    avg_hr_bpm:
      stravaActivity.average_heartrate != null
        ? Math.round(stravaActivity.average_heartrate)
        : null,
    max_hr_bpm:
      stravaActivity.max_heartrate != null ? Math.round(stravaActivity.max_heartrate) : null,
    avg_cadence_rpm:
      stravaActivity.average_cadence != null ? Math.round(stravaActivity.average_cadence) : null,
    strava_id: stravaActivity.id,
    source: "strava",
  };

  if (!streams || !streams.time?.data?.length) {
    return { activityData, trackPoints: [], metrics: [] };
  }

  const timeData = streams.time.data;
  const startEpochMs = new Date(stravaActivity.start_date).getTime();

  const trackPoints: TrackPoint[] = [];
  const metrics: ParsedMetric[] = [];

  for (let i = 0; i < timeData.length; i++) {
    const latlng = streams.latlng?.data?.[i];

    trackPoints.push({
      timestamp: startEpochMs + timeData[i] * 1000,
      lat: latlng?.[0] ?? 0,
      lon: latlng?.[1] ?? 0,
      elevation: streams.altitude?.data?.[i] ?? null,
      power: streams.watts?.data?.[i] ?? null,
      hr: streams.heartrate?.data?.[i] ?? null,
      cadence: streams.cadence?.data?.[i] ?? null,
    });

    const velocityMs = streams.velocity_smooth?.data?.[i];

    metrics.push({
      timestampSeconds: timeData[i],
      powerWatts: streams.watts?.data?.[i] ?? null,
      hrBpm: streams.heartrate?.data?.[i] ?? null,
      cadenceRpm: streams.cadence?.data?.[i] ?? null,
      speedKmh: velocityMs != null ? Math.round(velocityMs * 3.6 * 100) / 100 : null,
    });
  }

  return { activityData, trackPoints, metrics };
}
