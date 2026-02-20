import type { PlanDay } from "shared";

// ─── Demo Profile ───────────────────────────────────────────────
export const DEMO_PROFILE = {
  id: "demo-user-001",
  email: "carlos@demo.cycling-companion.app",
  display_name: "Carlos García",
  age: 45,
  weight_kg: 78,
  ftp: 230,
  max_hr: 178,
  rest_hr: 52,
  goal: "performance" as const,
};

// ─── Onboarding form data (string-based for the wizard) ─────────
export const DEMO_ONBOARDING_DATA = {
  name: "Carlos García",
  age: "45",
  weight: "78",
  ftp: "230",
  maxHR: "178",
  restHR: "52",
  goal: "performance",
};

// ─── Activities (febrero 2026) ──────────────────────────────────
export interface DemoActivity {
  id: string;
  name: string;
  date: string;
  type: string;
  duration_seconds: number;
  distance_km: number | null;
  avg_power_watts: number | null;
  avg_hr_bpm: number | null;
  max_hr_bpm: number | null;
  avg_cadence_rpm: number | null;
  tss: number | null;
  rpe: number | null;
}

export const DEMO_ACTIVITIES: DemoActivity[] = [
  // Semana 1: 2–8 feb
  {
    id: "demo-act-01",
    name: "Endurance base — Anillo Verde",
    date: "2026-02-02",
    type: "endurance",
    duration_seconds: 5400,
    distance_km: 45.2,
    avg_power_watts: 165,
    avg_hr_bpm: 132,
    max_hr_bpm: 148,
    avg_cadence_rpm: 82,
    tss: 58,
    rpe: 4,
  },
  {
    id: "demo-act-02",
    name: "Intervalos 4×8min Z4",
    date: "2026-02-04",
    type: "intervals",
    duration_seconds: 4200,
    distance_km: 35.8,
    avg_power_watts: 215,
    avg_hr_bpm: 158,
    max_hr_bpm: 174,
    avg_cadence_rpm: 88,
    tss: 82,
    rpe: 7,
  },
  {
    id: "demo-act-03",
    name: "Recuperación activa",
    date: "2026-02-05",
    type: "recovery",
    duration_seconds: 2700,
    distance_km: 22.1,
    avg_power_watts: 120,
    avg_hr_bpm: 112,
    max_hr_bpm: 128,
    avg_cadence_rpm: 78,
    tss: 25,
    rpe: 2,
  },
  {
    id: "demo-act-04",
    name: "Tempo — Puerto de Navacerrada",
    date: "2026-02-07",
    type: "tempo",
    duration_seconds: 6300,
    distance_km: 52.4,
    avg_power_watts: 195,
    avg_hr_bpm: 148,
    max_hr_bpm: 165,
    avg_cadence_rpm: 80,
    tss: 95,
    rpe: 6,
  },
  // Semana 2: 9–15 feb
  {
    id: "demo-act-05",
    name: "Endurance — Casa de Campo",
    date: "2026-02-09",
    type: "endurance",
    duration_seconds: 7200,
    distance_km: 62.3,
    avg_power_watts: 170,
    avg_hr_bpm: 135,
    max_hr_bpm: 150,
    avg_cadence_rpm: 84,
    tss: 75,
    rpe: 5,
  },
  {
    id: "demo-act-06",
    name: "Intervalos 5×5min Z5",
    date: "2026-02-10",
    type: "intervals",
    duration_seconds: 3600,
    distance_km: 30.5,
    avg_power_watts: 235,
    avg_hr_bpm: 164,
    max_hr_bpm: 176,
    avg_cadence_rpm: 92,
    tss: 90,
    rpe: 8,
  },
  {
    id: "demo-act-07",
    name: "Recuperación — rodillo suave",
    date: "2026-02-11",
    type: "recovery",
    duration_seconds: 2400,
    distance_km: 18.0,
    avg_power_watts: 115,
    avg_hr_bpm: 108,
    max_hr_bpm: 122,
    avg_cadence_rpm: 76,
    tss: 20,
    rpe: 2,
  },
  {
    id: "demo-act-08",
    name: "Tempo progresivo — M-607",
    date: "2026-02-12",
    type: "tempo",
    duration_seconds: 5400,
    distance_km: 48.0,
    avg_power_watts: 200,
    avg_hr_bpm: 150,
    max_hr_bpm: 168,
    avg_cadence_rpm: 82,
    tss: 88,
    rpe: 6,
  },
  {
    id: "demo-act-09",
    name: "Endurance largo — Manzanares",
    date: "2026-02-15",
    type: "endurance",
    duration_seconds: 9000,
    distance_km: 78.5,
    avg_power_watts: 168,
    avg_hr_bpm: 130,
    max_hr_bpm: 145,
    avg_cadence_rpm: 83,
    tss: 92,
    rpe: 5,
  },
  // Semana 3: 16–22 feb (semana actual)
  {
    id: "demo-act-10",
    name: "Endurance — Dehesa de la Villa",
    date: "2026-02-16",
    type: "endurance",
    duration_seconds: 5400,
    distance_km: 46.8,
    avg_power_watts: 172,
    avg_hr_bpm: 134,
    max_hr_bpm: 149,
    avg_cadence_rpm: 83,
    tss: 62,
    rpe: 4,
  },
  {
    id: "demo-act-11",
    name: "Intervalos 6×4min Z5 + 2min Z1",
    date: "2026-02-17",
    type: "intervals",
    duration_seconds: 4500,
    distance_km: 38.2,
    avg_power_watts: 228,
    avg_hr_bpm: 162,
    max_hr_bpm: 177,
    avg_cadence_rpm: 90,
    tss: 95,
    rpe: 8,
  },
  {
    id: "demo-act-12",
    name: "Recuperación activa — rodillo",
    date: "2026-02-18",
    type: "recovery",
    duration_seconds: 2700,
    distance_km: 20.5,
    avg_power_watts: 118,
    avg_hr_bpm: 110,
    max_hr_bpm: 125,
    avg_cadence_rpm: 77,
    tss: 22,
    rpe: 2,
  },
  {
    id: "demo-act-13",
    name: "Tempo — subida a Colmenar",
    date: "2026-02-19",
    type: "tempo",
    duration_seconds: 5700,
    distance_km: 50.1,
    avg_power_watts: 198,
    avg_hr_bpm: 149,
    max_hr_bpm: 166,
    avg_cadence_rpm: 81,
    tss: 90,
    rpe: 6,
  },
];

// ─── Weekly Plans (4 semanas de febrero) ────────────────────────
const WEEK3_PLAN: PlanDay[] = [
  {
    day: "Lunes",
    date: "2026-02-16",
    type: "endurance",
    title: "Base aeróbica",
    intensity: "media",
    duration: "1h 30min",
    description:
      "Rodaje suave en zona 2. Mantén cadencia alta (85-90 rpm) y potencia estable entre 155-175W. Ideal para consolidar base aeróbica.",
    nutrition: "Desayuno completo 2h antes. 1 bidón con electrolitos.",
    rest: "Estiramientos 10 min post-entrenamiento.",
    done: true,
    actual_power: 172,
  },
  {
    day: "Martes",
    date: "2026-02-17",
    type: "intervals",
    title: "Intervalos Z5 — VO2max",
    intensity: "alta",
    duration: "1h 15min",
    description:
      "Calentamiento 15min progresivo. 6×4min a 240-260W (Z5) con 2min recuperación a 120W. Vuelta a la calma 10min.",
    nutrition: "Gel o barrita durante el entrenamiento. Recuperador post con 30g proteína.",
    rest: "Dormir mínimo 8h. Evitar actividad intensa posterior.",
    done: true,
    actual_power: 228,
  },
  {
    day: "Miércoles",
    date: "2026-02-18",
    type: "recovery",
    title: "Recuperación activa",
    intensity: "baja",
    duration: "45min",
    description:
      "Rodillo o ruta plana muy suave. Potencia por debajo de 130W. Cadencia libre. El objetivo es movilizar sin generar fatiga.",
    nutrition: "Hidratación normal. No requiere nutrición extra.",
    rest: "Foam roller o masaje de piernas 15 min.",
    done: true,
    actual_power: 118,
  },
  {
    day: "Jueves",
    date: "2026-02-19",
    type: "tempo",
    title: "Tempo sostenido",
    intensity: "media-alta",
    duration: "1h 35min",
    description:
      "Calentamiento 15min. 2×25min a 195-210W (Z3-Z4) con 5min recuperación. Trabaja mantener potencia estable sin picos.",
    nutrition: "Barrita energética a mitad del entrenamiento. 2 bidones.",
    rest: "Estiramientos dinámicos. Cena rica en carbohidratos.",
    done: true,
    actual_power: 198,
  },
  {
    day: "Viernes",
    date: "2026-02-20",
    type: "rest",
    title: "Descanso total",
    intensity: "—",
    duration: "—",
    description:
      "Día de descanso completo. Tu cuerpo necesita asimilar el trabajo de la semana. Puedes caminar o hacer movilidad ligera.",
    nutrition: "Mantén una alimentación equilibrada. Hidratación abundante.",
    rest: "Prioriza 8-9h de sueño. Evita pantallas antes de dormir.",
    done: false,
    actual_power: null,
  },
  {
    day: "Sábado",
    date: "2026-02-21",
    type: "endurance",
    title: "Fondo largo",
    intensity: "media",
    duration: "2h 30min",
    description:
      "Salida larga por carretera. Mantén Z2 (155-175W) constante. Practica nutrición en ruta. Objetivo: acumular tiempo en zona aeróbica.",
    nutrition: "Desayuno completo 3h antes. 1 gel cada 45min. 2-3 bidones.",
    rest: "Comida de recuperación en los 30min siguientes. Siesta si es posible.",
    done: false,
    actual_power: null,
  },
  {
    day: "Domingo",
    date: "2026-02-22",
    type: "recovery",
    title: "Regenerativo",
    intensity: "baja",
    duration: "45min",
    description:
      "Rodaje muy suave para favorecer la recuperación del fondo del sábado. Máximo 120W. Cadencia cómoda.",
    nutrition: "Hidratación normal. Comida equilibrada.",
    rest: "Preparar la semana. Revisar plan y objetivos.",
    done: false,
    actual_power: null,
  },
];

export const DEMO_PLAN_DAYS: PlanDay[] = WEEK3_PLAN;

// ─── Dashboard data ─────────────────────────────────────────────
export const DEMO_DASHBOARD = {
  weekNumber: 8,
  greeting: "Buenas tardes",
  userName: "Carlos",
  activityCount: 4,
  kpis: {
    distance: { value: "155.6", trend: { direction: "up" as const, percentage: 12 } },
    duration: { value: "5h 06m", trend: { direction: "up" as const, percentage: 8 } },
    power: { value: "179", trend: { direction: "up" as const, percentage: 3 } },
    hr: { value: "139", trend: { direction: "down" as const, percentage: 2 } },
  },
  overload: {
    currentLoad: 269,
    avgLoad: 220,
  },
  powerTrend: [
    { week: "S5", power: 174, hr: 138 },
    { week: "S6", power: 178, hr: 137 },
    { week: "S7", power: 185, hr: 141 },
    { week: "S8", power: 179, hr: 139 },
  ],
  dailyLoad: [
    { day: "Lun", load: 62 },
    { day: "Mar", load: 95 },
    { day: "Mié", load: 22 },
    { day: "Jue", load: 90 },
    { day: "Vie", load: 0 },
    { day: "Sáb", load: 0 },
    { day: "Dom", load: 0 },
  ],
  coachTip: {
    recommendation:
      "Buena progresión esta semana, Carlos. Tus intervalos del martes muestran una mejora del 3% en potencia media respecto a la semana anterior. Mantén el foco en el fondo largo del sábado — es clave para tu base aeróbica.",
    tips: {
      hydration: "2.5L mínimo los días de entrenamiento",
      sleep: "8h recomendadas, especialmente tras intervalos",
      nutrition: "+40g carbohidratos post-entrenamiento intenso",
    },
  },
  recentActivities: [
    {
      id: "demo-act-13",
      name: "Tempo — subida a Colmenar",
      date: "2026-02-19",
      type: "tempo",
      distance_km: 50.1,
      duration_seconds: 5700,
      avg_power_watts: 198,
      avg_hr_bpm: 149,
    },
    {
      id: "demo-act-12",
      name: "Recuperación activa — rodillo",
      date: "2026-02-18",
      type: "recovery",
      distance_km: 20.5,
      duration_seconds: 2700,
      avg_power_watts: 118,
      avg_hr_bpm: 110,
    },
    {
      id: "demo-act-11",
      name: "Intervalos 6×4min Z5 + 2min Z1",
      date: "2026-02-17",
      type: "intervals",
      distance_km: 38.2,
      duration_seconds: 4500,
      avg_power_watts: 228,
      avg_hr_bpm: 162,
    },
    {
      id: "demo-act-10",
      name: "Endurance — Dehesa de la Villa",
      date: "2026-02-16",
      type: "endurance",
      distance_km: 46.8,
      duration_seconds: 5400,
      avg_power_watts: 172,
      avg_hr_bpm: 134,
    },
  ],
};

// ─── Insights ───────────────────────────────────────────────────
export const DEMO_INSIGHTS = {
  periodA: { label: "2 – 8 feb", start: "2026-02-02", end: "2026-02-08" },
  periodB: { label: "9 – 15 feb", start: "2026-02-09", end: "2026-02-15" },
  comparisonMetrics: [
    { metric: "Distancia", valueA: 155.5, valueB: 237.3, unit: "km", color: "#f97316" },
    { metric: "Duración", valueA: 5.17, valueB: 7.67, unit: "h", color: "#8b5cf6" },
    { metric: "Pot. media", valueA: 174, valueB: 178, unit: "W", color: "#22c55e" },
    { metric: "FC media", valueA: 138, valueB: 137, unit: "bpm", color: "#ef4444", inverse: true },
    { metric: "TSS total", valueA: 260, valueB: 365, unit: "", color: "#eab308" },
    { metric: "RPE medio", valueA: 4.8, valueB: 5.2, unit: "", color: "#06b6d4", inverse: true },
  ],
  radarDimensions: [
    { metric: "Resistencia", A: 65, B: 82 },
    { metric: "Potencia", A: 72, B: 75 },
    { metric: "Velocidad", A: 68, B: 71 },
    { metric: "Recuperación", A: 78, B: 74 },
    { metric: "Consistencia", A: 60, B: 80 },
    { metric: "Volumen", A: 55, B: 75 },
  ],
  analysis: {
    summary:
      "Excelente progresión entre semanas. El volumen aumentó un 40% manteniendo la potencia media, lo que indica buena adaptación aeróbica. La FC media se redujo ligeramente — señal de mejora cardiovascular.",
    alert: "El TSS semanal subió significativamente. Vigila señales de fatiga acumulada.",
    recommendation:
      "Mantén este volumen una semana más y luego programa una semana de descarga (-30% volumen) para consolidar las adaptaciones.",
  },
};
