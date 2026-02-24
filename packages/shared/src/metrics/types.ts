/** Punto interno unificado tras parseo de .fit o .gpx */
export interface TrackPoint {
  timestamp: number; // epoch ms
  lat: number;
  lon: number;
  elevation: number | null;
  power: number | null;
  hr: number | null;
  cadence: number | null;
  speed?: number; // calculado por Haversine (km/h)
  isMoving?: boolean; // calculado por movement detection
}

/** Resumen completo de metricas de una actividad */
export interface ActivitySummary {
  duration_total: number; // segundos
  duration_moving: number; // segundos
  distance_km: number; // km
  avg_speed: number; // km/h (basado en moving time)
  max_speed: number; // km/h
  avg_power: number | null; // W (incluyendo ceros)
  avg_power_non_zero: number | null; // W (excluyendo ceros)
  normalized_power: number | null; // W (NP)
  variability_index: number | null; // NP / avg_power
  intensity_factor: number | null; // NP / FTP
  avg_hr: number | null; // bpm (serie completa)
  avg_hr_moving: number | null; // bpm (solo en movimiento)
  max_hr: number | null; // bpm
  avg_cadence_moving: number | null; // rpm (solo en movimiento)
  tss: number | null; // Training Stress Score
  elevation_gain: number | null; // metros
  max_power: number | null; // W
}

/** Umbrales de validacion de sensores y movimiento */
export const METRICS_THRESHOLDS = {
  MAX_POWER_WATTS: 2000,
  MAX_HR_BPM: 230,
  MAX_SPEED_KMH: 100,
  MIN_MOVING_SPEED_KMH: 1,
  MIN_MOVING_BLOCK_SECONDS: 3,
  MIN_DURATION_FOR_NP_SECONDS: 600,
  MAX_GAP_INTERPOLATION_SECONDS: 30,
  ELEVATION_SMOOTHING_WINDOW: 5,
} as const;
