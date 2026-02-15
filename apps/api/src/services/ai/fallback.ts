import type {
  AIActivityAnalysis,
  AICoachTip,
  AIWeeklySummary,
  AIWeeklyPlanResponse,
  UserProfile,
  Activity,
  TrainingLoad,
  TrainingAlert,
} from "shared";
import { classifyActivityZone } from "shared";

export function fallbackAnalyzeActivity(
  activity: Activity,
  profile: UserProfile,
  trainingLoad: TrainingLoad,
  alerts: TrainingAlert[],
): AIActivityAnalysis {
  const zone = classifyActivityZone(activity.avg_power_watts, profile.ftp ?? null);
  const durationMin = Math.round(activity.duration_seconds / 60);

  let summary = `Sesión de ${activity.type} de ${durationMin} minutos.`;
  if (activity.avg_power_watts) {
    summary += ` Potencia media de ${activity.avg_power_watts}W`;
    if (zone) summary += ` (${zone})`;
    summary += ".";
  }

  let recommendation: string;
  if (trainingLoad.tsb < -15) {
    recommendation =
      "Tu nivel de fatiga es alto. Considera una sesión de recuperación activa o descanso completo mañana.";
  } else if (trainingLoad.tsb > 15) {
    recommendation =
      "Estás fresco y con buena forma. Buen momento para una sesión de calidad con intervalos.";
  } else {
    recommendation =
      "Mantén la alternancia entre sesiones intensas y de recuperación para optimizar las adaptaciones.";
  }

  const overloadAlert = alerts.find((a) => a.type === "overload");
  if (overloadAlert) {
    recommendation = "Tu carga semanal es alta. Prioriza la recuperación en las próximas sesiones.";
  }

  return {
    summary,
    recommendation,
    tips: {
      hydration: "Recuerda hidratarte bien: 500ml por hora de ejercicio.",
      nutrition: "Repón carbohidratos en los 30 minutos post-sesión.",
    },
  };
}

const WEEK_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function fallbackWeeklyPlan(
  weekDates: Array<{ day: string; date: string }>,
  profile: UserProfile,
  trainingLoad: TrainingLoad,
  alerts: TrainingAlert[],
): AIWeeklyPlanResponse {
  const goal = profile.goal ?? "general";
  const isFatigued = trainingLoad.tsb < -15;
  const hasOverload = alerts.some((a) => a.type === "overload");

  const templates: Record<
    string,
    Array<{ type: string; intensity: string; title: string; duration: string }>
  > = {
    performance: [
      { type: "intervals", intensity: "alta", title: "Intervalos de potencia", duration: "1h15" },
      { type: "recovery", intensity: "baja", title: "Recuperación activa", duration: "45min" },
      { type: "tempo", intensity: "media-alta", title: "Ritmo sostenido", duration: "1h30" },
      { type: "rest", intensity: "—", title: "Descanso", duration: "—" },
      { type: "endurance", intensity: "media", title: "Rodaje aeróbico Z2", duration: "1h30" },
      { type: "intervals", intensity: "alta", title: "Series cortas VO2máx", duration: "1h" },
      { type: "endurance", intensity: "media", title: "Rodaje largo Z2", duration: "2h30" },
    ],
    health: [
      { type: "endurance", intensity: "media", title: "Rodaje suave Z2", duration: "1h" },
      { type: "rest", intensity: "—", title: "Descanso", duration: "—" },
      { type: "endurance", intensity: "media", title: "Rodaje moderado", duration: "1h15" },
      { type: "recovery", intensity: "baja", title: "Recuperación activa", duration: "30min" },
      { type: "rest", intensity: "—", title: "Descanso", duration: "—" },
      { type: "endurance", intensity: "media", title: "Rodaje fin de semana", duration: "1h30" },
      { type: "rest", intensity: "—", title: "Descanso", duration: "—" },
    ],
    general: [
      { type: "endurance", intensity: "media", title: "Rodaje aeróbico Z2", duration: "1h15" },
      { type: "recovery", intensity: "baja", title: "Recuperación activa", duration: "45min" },
      { type: "intervals", intensity: "alta", title: "Intervalos", duration: "1h" },
      { type: "rest", intensity: "—", title: "Descanso", duration: "—" },
      { type: "tempo", intensity: "media-alta", title: "Ritmo sostenido", duration: "1h15" },
      { type: "rest", intensity: "—", title: "Descanso", duration: "—" },
      { type: "endurance", intensity: "media", title: "Rodaje largo", duration: "2h" },
    ],
  };

  const template = templates[goal] ?? templates.general;

  const days = weekDates.map((d, i) => {
    const t = template[i % template.length];
    return {
      day: d.day || WEEK_DAYS[i],
      date: d.date,
      type: t.type as "intervals" | "endurance" | "recovery" | "tempo" | "rest",
      title: t.title,
      intensity: t.intensity as "alta" | "media-alta" | "media" | "baja" | "—",
      duration: t.duration,
      description:
        t.type === "rest" ? "Día de descanso completo" : `${t.title} adaptado a tu nivel.`,
      nutrition:
        t.type === "rest"
          ? "Alimentación normal equilibrada."
          : "Carbohidratos 2h antes. Hidratación durante.",
      rest:
        t.type === "rest" ? "Descanso total o paseo suave." : "Estiramientos 10min post-sesión.",
    };
  });

  let rationale = `Plan generado automáticamente basado en tu objetivo de ${goal}.`;
  if (isFatigued || hasOverload) {
    rationale += " Se recomienda priorizar la recuperación esta semana.";
  } else {
    rationale += " Ajusta según cómo te sientas cada día.";
  }

  return { days, rationale };
}

export function fallbackWeeklySummary(
  periodA: { sessionCount: number; totalTSS: number; avgPower: number | null },
  periodB: { sessionCount: number; totalTSS: number; avgPower: number | null },
  alerts: TrainingAlert[],
): AIWeeklySummary {
  const parts: string[] = [];

  if (periodA.avgPower && periodB.avgPower) {
    const delta = Math.round(((periodB.avgPower - periodA.avgPower) / periodA.avgPower) * 100);
    if (Math.abs(delta) >= 1) {
      parts.push(
        delta > 0
          ? `Tu potencia media ha subido un ${delta}%, lo que indica buena adaptación.`
          : `Tu potencia media ha bajado un ${Math.abs(delta)}%. Puede ser fatiga o falta de intensidad.`,
      );
    }
  }

  const summary =
    parts.length > 0
      ? parts.join(" ")
      : `Has completado ${periodB.sessionCount} sesiones en el periodo actual.`;

  let alert: string | undefined;
  const overloadAlert = alerts.find((a) => a.type === "overload" && a.level !== "none");
  if (overloadAlert) {
    alert = overloadAlert.message;
  }

  const recommendation =
    periodB.sessionCount < 3
      ? "Intenta añadir una sesión más para mejorar la consistencia."
      : "Buen ritmo. Mantén la alternancia entre intensidad y recuperación.";

  return { summary, alert, recommendation };
}

export function fallbackCoachTip(
  profile: UserProfile,
  lastActivity: Activity | null,
  trainingLoad: TrainingLoad,
  alerts: TrainingAlert[],
): AICoachTip {
  const restAlert = alerts.find((a) => a.type === "rest_needed" && a.level !== "none");
  const detrainingAlert = alerts.find((a) => a.type === "detraining" && a.level !== "none");
  const goalLabel = profile.goal ?? "general";

  let recommendation: string;

  if (restAlert) {
    recommendation =
      "Llevas varios días de alta intensidad. Hoy es un buen día para recuperación activa: un rodaje suave de 30-45 minutos en Z1.";
  } else if (detrainingAlert) {
    recommendation =
      "Llevas tiempo sin entrenar. Retoma con una sesión suave de 45 minutos en Z2 para recuperar sensaciones.";
  } else if (trainingLoad.tsb < -20) {
    recommendation =
      "Tu nivel de fatiga es elevado. Considera un día de descanso completo o una sesión muy suave para favorecer la recuperación.";
  } else if (trainingLoad.tsb > 15) {
    recommendation =
      "Estás fresco y en buena forma. Aprovecha para una sesión de calidad: intervalos o tempo sostenido.";
  } else if (lastActivity) {
    recommendation = `Tras tu última sesión de ${lastActivity.type}, alterna con un tipo diferente hoy para equilibrar la carga.`;
  } else {
    recommendation =
      goalLabel === "performance"
        ? "Mantén la constancia con al menos 4 sesiones semanales para seguir progresando."
        : "Mantén la constancia con al menos 3 sesiones semanales. La regularidad es más importante que la intensidad.";
  }

  return {
    recommendation,
    tips: {
      hydration: "Bebe 500ml de agua 2 horas antes de entrenar.",
      sleep: "7-8 horas de sueño para una recuperación óptima.",
      nutrition: "Incluye proteínas en las comidas post-entrenamiento.",
    },
  };
}
