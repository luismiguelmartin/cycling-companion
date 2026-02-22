export interface ImportFormData {
  name: string;
  date: string;
  type: string;
  duration_h: string;
  duration_m: string;
  duration_s: string;
  distance: string;
  avgPower: string;
  avgHR: string;
  maxHR: string;
  avgCadence: string;
  rpe: number;
  notes: string;
}

const MOCK_NAMES = [
  "Ruta de entrenamiento",
  "Intervalos matutinos",
  "Salida larga fin de semana",
  "Recuperación activa",
  "Tempo en llano",
  "Subida al puerto",
];

const MOCK_TYPES = ["intervals", "endurance", "recovery", "tempo"] as const;

export function generateMockActivity(): ImportFormData {
  return {
    name: MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)],
    date: new Date().toISOString().split("T")[0],
    type: MOCK_TYPES[Math.floor(Math.random() * MOCK_TYPES.length)],
    duration_h: String(1 + Math.floor(Math.random() * 3)),
    duration_m: String(Math.floor(Math.random() * 60)).padStart(2, "0"),
    duration_s: "00",
    distance: (30 + Math.random() * 70).toFixed(1),
    avgPower: String(150 + Math.floor(Math.random() * 70)),
    avgHR: String(135 + Math.floor(Math.random() * 30)),
    maxHR: String(165 + Math.floor(Math.random() * 20)),
    avgCadence: String(80 + Math.floor(Math.random() * 15)),
    rpe: 5 + Math.floor(Math.random() * 4),
    notes: "Buen día, sensaciones positivas. Viento moderado del SO.",
  };
}

/** Payload listo para POST /activities (sin conversión de duración). */
export interface MockActivityPayload {
  name: string;
  date: string;
  type: string;
  duration_seconds: number;
  distance_km: number;
  avg_power_watts: number;
  avg_hr_bpm: number;
  max_hr_bpm: number;
  avg_cadence_rpm: number;
  rpe: number;
  notes: string;
}

const WEEK_PLAN: {
  type: string;
  name: string;
  durationSeconds: number;
  distanceKm: number;
  avgPower: number;
  avgHr: number;
  maxHr: number;
  avgCadence: number;
  rpe: number;
  notes: string;
}[] = [
  {
    type: "endurance",
    name: "Ruta base aeróbica",
    durationSeconds: 7200,
    distanceKm: 55,
    avgPower: 170,
    avgHr: 145,
    maxHr: 158,
    avgCadence: 88,
    rpe: 5,
    notes: "Rodaje suave para construir base aeróbica. Cadencia alta, esfuerzo controlado.",
  },
  {
    type: "intervals",
    name: "Series de intensidad",
    durationSeconds: 5400,
    distanceKm: 38,
    avgPower: 210,
    avgHr: 162,
    maxHr: 182,
    avgCadence: 92,
    rpe: 8,
    notes: "6x5min a umbral con 3min recuperación. Buenas sensaciones en las últimas series.",
  },
  {
    type: "recovery",
    name: "Recuperación activa",
    durationSeconds: 3600,
    distanceKm: 25,
    avgPower: 130,
    avgHr: 125,
    maxHr: 140,
    avgCadence: 85,
    rpe: 3,
    notes: "Rodaje regenerativo post-series. Piernas algo pesadas al inicio pero mejorando.",
  },
  {
    type: "tempo",
    name: "Tempo sostenido",
    durationSeconds: 6300,
    distanceKm: 48,
    avgPower: 195,
    avgHr: 155,
    maxHr: 170,
    avgCadence: 90,
    rpe: 7,
    notes: "40min a ritmo tempo sostenido. Buen trabajo de umbral con viento lateral.",
  },
  {
    type: "endurance",
    name: "Salida larga fin de semana",
    durationSeconds: 10800,
    distanceKm: 82,
    avgPower: 165,
    avgHr: 148,
    maxHr: 165,
    avgCadence: 86,
    rpe: 6,
    notes: "Ruta larga con dos puertos. Gestión del esfuerzo y alimentación en ruta.",
  },
];

/**
 * Genera 5 actividades mock (Lun→Vie) de la semana en curso,
 * listas para enviar directamente a POST /activities.
 */
export function generateWeekMockActivities(): MockActivityPayload[] {
  // Lunes de la semana en curso (UTC)
  const now = new Date();
  const day = now.getUTCDay(); // 0=Dom
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diffToMonday, 8, 0, 0),
  );

  return WEEK_PLAN.map((plan, i) => {
    const date = new Date(monday.getTime());
    date.setUTCDate(date.getUTCDate() + i);
    return {
      name: plan.name,
      date: date.toISOString().split("T")[0],
      type: plan.type,
      duration_seconds: plan.durationSeconds,
      distance_km: plan.distanceKm,
      avg_power_watts: plan.avgPower,
      avg_hr_bpm: plan.avgHr,
      max_hr_bpm: plan.maxHr,
      avg_cadence_rpm: plan.avgCadence,
      rpe: plan.rpe,
      notes: plan.notes,
    };
  });
}
