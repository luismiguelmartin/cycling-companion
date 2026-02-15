import type { UserProfile, Activity, TrainingLoad, TrainingAlert } from "shared";

export const PROMPT_VERSION = "v1.0";

const SYSTEM_BASE = `Eres Coach IA, entrenador de ciclismo experto especializado en ciclistas amateur mayores de 40 años.

TONO:
- Cercano pero profesional, basado en datos
- Motivador sin ser condescendiente
- Siempre explicas el porqué
- Usa "Considera...", "Te sugiero...", nunca "Debes..."

REGLAS:
- Responde SOLO en JSON válido, sin markdown ni texto adicional
- Todos los textos en español
- Máximo 2-3 frases por campo de texto
- Las recomendaciones deben ser accionables y específicas

CIENCIA DEL ENTRENAMIENTO:
- TSS (Training Stress Score): carga de una sesión. <50 fácil, 50-150 moderado, >150 duro
- CTL (Chronic Training Load): fitness acumulado (media 42 días). Más alto = mejor forma base
- ATL (Acute Training Load): fatiga reciente (media 7 días). Alto = necesita recuperación
- TSB (Training Stress Balance): CTL - ATL. Positivo = fresco, negativo = fatigado, <-30 riesgo`;

function formatProfile(profile: UserProfile): string {
  return `- Edad: ${profile.age ?? "no especificada"}
- Peso: ${profile.weight_kg ?? "no especificado"}kg
- FTP: ${profile.ftp ?? "no definido"}W
- FC máx: ${profile.max_hr ?? "no definida"}bpm
- FC reposo: ${profile.rest_hr ?? "no definida"}bpm
- Objetivo: ${profile.goal ?? "general"}`;
}

function formatTrainingLoad(load: TrainingLoad): string {
  return `- CTL (fitness): ${load.ctl}
- ATL (fatiga): ${load.atl}
- TSB (forma): ${load.tsb} (${load.tsb > 0 ? "fresco" : load.tsb > -15 ? "normal" : "fatigado"})`;
}

function formatAlerts(alerts: TrainingAlert[]): string {
  if (alerts.length === 0) return "- Sin alertas activas";
  return alerts.map((a) => `- [${a.level.toUpperCase()}] ${a.message}`).join("\n");
}

export interface AnalyzeActivityContext {
  profile: UserProfile;
  activity: Activity;
  recentActivities: Activity[];
  trainingLoad: TrainingLoad;
  alerts: TrainingAlert[];
  zone: string | null;
}

export function buildAnalyzeActivityPrompt(ctx: AnalyzeActivityContext): {
  system: string;
  user: string;
} {
  const system = `${SYSTEM_BASE}

FORMATO DE RESPUESTA (JSON exacto):
{
  "summary": "Resumen de la sesión en 2-3 frases, mencionando datos clave",
  "recommendation": "Recomendación específica para la próxima sesión",
  "tips": {
    "hydration": "Consejo de hidratación breve (opcional)",
    "nutrition": "Consejo de nutrición breve (opcional)",
    "sleep": "Consejo de descanso breve (opcional)"
  }
}`;

  const user = `PERFIL DEL CICLISTA:
${formatProfile(ctx.profile)}

ACTIVIDAD A ANALIZAR:
- Nombre: ${ctx.activity.name}
- Tipo: ${ctx.activity.type}
- Fecha: ${ctx.activity.date}
- Duración: ${Math.round(ctx.activity.duration_seconds / 60)} minutos
- Potencia media: ${ctx.activity.avg_power_watts ?? "N/A"}W
- FC media: ${ctx.activity.avg_hr_bpm ?? "N/A"}bpm
- TSS: ${ctx.activity.tss ?? "N/A"}
- RPE: ${ctx.activity.rpe ?? "N/A"}/10
- Zona de potencia: ${ctx.zone ?? "N/A"}

MÉTRICAS DE ENTRENAMIENTO ACTUALES:
${formatTrainingLoad(ctx.trainingLoad)}

ALERTAS ACTIVAS:
${formatAlerts(ctx.alerts)}

ACTIVIDADES RECIENTES (últimas 2 semanas):
${ctx.recentActivities.length > 0 ? ctx.recentActivities.map((a) => `- ${a.date}: ${a.name} (${a.type}, TSS: ${a.tss ?? "N/A"}, ${Math.round(a.duration_seconds / 60)}min)`).join("\n") : "- Sin actividades recientes"}

Analiza esta sesión y genera el JSON de respuesta.`;

  return { system, user };
}

export interface WeeklyPlanContext {
  profile: UserProfile;
  recentActivities: Activity[];
  trainingLoad: TrainingLoad;
  alerts: TrainingAlert[];
  weekDates: Array<{ day: string; date: string }>;
}

export function buildWeeklyPlanPrompt(ctx: WeeklyPlanContext): {
  system: string;
  user: string;
} {
  const system = `${SYSTEM_BASE}

TIPOS DE ACTIVIDAD VÁLIDOS: "intervals", "endurance", "recovery", "tempo", "rest"
NIVELES DE INTENSIDAD VÁLIDOS: "alta", "media-alta", "media", "baja", "—"

FORMATO DE RESPUESTA (JSON exacto):
{
  "days": [
    {
      "day": "Lun",
      "date": "2026-02-16",
      "type": "endurance",
      "title": "Rodaje aeróbico Z2",
      "intensity": "media",
      "duration": "1h30",
      "description": "Rodaje suave en zona 2 para base aeróbica",
      "nutrition": "Desayuno 2h antes, gel a los 45min",
      "rest": "Estiramientos 10min post-sesión"
    }
  ],
  "rationale": "Explicación breve de por qué este plan es adecuado"
}

REGLAS DEL PLAN:
- Exactamente 7 días (lunes a domingo)
- Al menos 1 día de descanso completo (type: "rest", intensity: "—", duration: "—")
- Alternar días intensos con recuperación
- No más de 2 días consecutivos de alta intensidad
- Adaptar al objetivo y nivel del ciclista
- Duración en formato "1h30", "45min", "—" para descanso`;

  const user = `PERFIL DEL CICLISTA:
${formatProfile(ctx.profile)}

MÉTRICAS DE ENTRENAMIENTO:
${formatTrainingLoad(ctx.trainingLoad)}

ALERTAS ACTIVAS:
${formatAlerts(ctx.alerts)}

ACTIVIDADES RECIENTES (últimas 2 semanas):
${ctx.recentActivities.length > 0 ? ctx.recentActivities.map((a) => `- ${a.date}: ${a.name} (${a.type}, TSS: ${a.tss ?? "N/A"}, ${Math.round(a.duration_seconds / 60)}min)`).join("\n") : "- Sin actividades recientes"}

SEMANA A PLANIFICAR:
${ctx.weekDates.map((d) => `- ${d.day} ${d.date}`).join("\n")}

Genera un plan semanal personalizado en JSON.`;

  return { system, user };
}

export interface WeeklySummaryContext {
  profile: UserProfile;
  periodA: {
    start: string;
    end: string;
    sessionCount: number;
    totalTSS: number;
    avgPower: number | null;
  };
  periodB: {
    start: string;
    end: string;
    sessionCount: number;
    totalTSS: number;
    avgPower: number | null;
  };
  trainingLoad: TrainingLoad;
  alerts: TrainingAlert[];
}

export function buildWeeklySummaryPrompt(ctx: WeeklySummaryContext): {
  system: string;
  user: string;
} {
  const system = `${SYSTEM_BASE}

FORMATO DE RESPUESTA (JSON exacto):
{
  "summary": "Resumen comparativo de los dos periodos en 2-3 frases",
  "alert": "Alerta si hay algo preocupante (omitir si todo está bien)",
  "recommendation": "Recomendación accionable basada en la comparación"
}`;

  const user = `PERFIL DEL CICLISTA:
${formatProfile(ctx.profile)}

PERIODO A (${ctx.periodA.start} a ${ctx.periodA.end}):
- Sesiones: ${ctx.periodA.sessionCount}
- TSS total: ${ctx.periodA.totalTSS}
- Potencia media: ${ctx.periodA.avgPower ?? "N/A"}W

PERIODO B (${ctx.periodB.start} a ${ctx.periodB.end}):
- Sesiones: ${ctx.periodB.sessionCount}
- TSS total: ${ctx.periodB.totalTSS}
- Potencia media: ${ctx.periodB.avgPower ?? "N/A"}W

MÉTRICAS DE ENTRENAMIENTO:
${formatTrainingLoad(ctx.trainingLoad)}

ALERTAS ACTIVAS:
${formatAlerts(ctx.alerts)}

Genera un resumen comparativo en JSON.`;

  return { system, user };
}

export interface CoachTipContext {
  profile: UserProfile;
  lastActivity: Activity | null;
  trainingLoad: TrainingLoad;
  alerts: TrainingAlert[];
}

export function buildCoachTipPrompt(ctx: CoachTipContext): {
  system: string;
  user: string;
} {
  const system = `${SYSTEM_BASE}

FORMATO DE RESPUESTA (JSON exacto):
{
  "recommendation": "Recomendación del día en 2-3 frases, accionable y motivadora",
  "tips": {
    "hydration": "Consejo de hidratación breve (opcional)",
    "sleep": "Consejo de descanso breve (opcional)",
    "nutrition": "Consejo de nutrición breve (opcional)"
  }
}`;

  const user = `PERFIL DEL CICLISTA:
${formatProfile(ctx.profile)}

ÚLTIMA ACTIVIDAD:
${ctx.lastActivity ? `- ${ctx.lastActivity.date}: ${ctx.lastActivity.name} (${ctx.lastActivity.type}, TSS: ${ctx.lastActivity.tss ?? "N/A"}, ${Math.round(ctx.lastActivity.duration_seconds / 60)}min)` : "- Sin actividad reciente registrada"}

MÉTRICAS DE ENTRENAMIENTO:
${formatTrainingLoad(ctx.trainingLoad)}

ALERTAS ACTIVAS:
${formatAlerts(ctx.alerts)}

Genera la recomendación del día en JSON.`;

  return { system, user };
}
