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

const MOCK_TYPES = ["outdoor", "indoor", "recovery"] as const;

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
