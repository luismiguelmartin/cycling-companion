import type { TrainingLoad } from "./training-calculations.js";

export type AlertLevel = "none" | "warning" | "critical";

export interface TrainingAlert {
  type: "overload" | "rest_needed" | "detraining" | "ramp_rate";
  level: AlertLevel;
  message: string;
}

/**
 * Alerta de sobrecarga semanal.
 * ≥150% → critical, ≥120% → warning, <120% → none.
 */
export function checkOverloadAlert(weeklyTSS: number, avgWeeklyTSS: number): TrainingAlert {
  if (avgWeeklyTSS === 0) {
    return { type: "overload", level: "none", message: "" };
  }

  const percentage = (weeklyTSS / avgWeeklyTSS) * 100;

  if (percentage >= 150) {
    return {
      type: "overload",
      level: "critical",
      message: `Tu carga semanal (TSS ${weeklyTSS}) es un ${Math.round(percentage)}% del promedio. Riesgo alto de sobreentrenamiento.`,
    };
  }

  if (percentage >= 120) {
    return {
      type: "overload",
      level: "warning",
      message: `Tu carga semanal (TSS ${weeklyTSS}) es un ${Math.round(percentage)}% del promedio. Vigila la recuperación.`,
    };
  }

  return { type: "overload", level: "none", message: "" };
}

/**
 * Alerta de descanso urgente: 3+ días consecutivos de intensidad alta.
 * Intensidad alta: TSS ≥ 80 o RPE ≥ 8.
 */
export function checkRestAlert(
  recentActivities: Array<{ date: string; tss: number | null; rpe: number | null }>,
): TrainingAlert {
  if (recentActivities.length === 0) {
    return { type: "rest_needed", level: "none", message: "" };
  }

  const sorted = [...recentActivities].sort((a, b) => a.date.localeCompare(b.date));

  // Group by day and check if any activity that day is "intense"
  const dayIntense = new Map<string, boolean>();
  for (const a of sorted) {
    const day = a.date.slice(0, 10);
    const isIntense = (a.tss != null && a.tss >= 80) || (a.rpe != null && a.rpe >= 8);
    if (isIntense) {
      dayIntense.set(day, true);
    } else if (!dayIntense.has(day)) {
      dayIntense.set(day, false);
    }
  }

  // Find max consecutive intense days
  const days = [...dayIntense.keys()].sort();
  let maxConsecutive = 0;
  let current = 0;

  for (let i = 0; i < days.length; i++) {
    if (dayIntense.get(days[i])) {
      current++;
      // Check that days are actually consecutive
      if (i > 0 && current > 1) {
        const prev = new Date(days[i - 1]);
        const curr = new Date(days[i]);
        const diffMs = curr.getTime() - prev.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays !== 1) {
          current = 1;
        }
      }
      maxConsecutive = Math.max(maxConsecutive, current);
    } else {
      current = 0;
    }
  }

  if (maxConsecutive >= 4) {
    return {
      type: "rest_needed",
      level: "critical",
      message: `Llevas ${maxConsecutive} días consecutivos de alta intensidad. Un día de descanso es urgente.`,
    };
  }

  if (maxConsecutive >= 3) {
    return {
      type: "rest_needed",
      level: "warning",
      message: "Llevas 3 días consecutivos de alta intensidad. Considera un día de recuperación.",
    };
  }

  return { type: "rest_needed", level: "none", message: "" };
}

/**
 * Alerta de pérdida de forma (detraining).
 * 10+ días sin actividad → critical, 7+ días → warning, TSB > 25 → warning.
 */
export function checkDetrainingAlert(
  tsb: number,
  lastActivityDate: string | null,
  today: string,
): TrainingAlert {
  if (lastActivityDate) {
    const last = new Date(lastActivityDate);
    const now = new Date(today);
    const diffMs = now.getTime() - last.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays >= 10) {
      return {
        type: "detraining",
        level: "critical",
        message: `Llevas ${diffDays} días sin entrenar. Tu forma física puede estar disminuyendo significativamente.`,
      };
    }

    if (diffDays >= 7) {
      return {
        type: "detraining",
        level: "warning",
        message: `Llevas ${diffDays} días sin entrenar. Intenta retomar la actividad para mantener tu forma.`,
      };
    }
  }

  if (tsb > 25) {
    return {
      type: "detraining",
      level: "warning",
      message:
        "Tu TSB es muy alto, lo que indica mucho descanso relativo. Considera añadir carga para mantener la forma.",
    };
  }

  return { type: "detraining", level: "none", message: "" };
}

/**
 * Alerta de progresión excesiva (ramp rate).
 * CTL delta > 10/semana → critical, > 7/semana → warning.
 */
export function checkRampRateAlert(ctlCurrent: number, ctlPreviousWeek: number): TrainingAlert {
  const delta = ctlCurrent - ctlPreviousWeek;

  if (delta > 10) {
    return {
      type: "ramp_rate",
      level: "critical",
      message: `Tu CTL ha subido ${Math.round(delta)} puntos en una semana. Riesgo alto de lesión por progresión excesiva.`,
    };
  }

  if (delta > 7) {
    return {
      type: "ramp_rate",
      level: "warning",
      message: `Tu CTL ha subido ${Math.round(delta)} puntos en una semana. Modera el incremento de carga.`,
    };
  }

  return { type: "ramp_rate", level: "none", message: "" };
}

export interface AlertParams {
  weeklyTSS: number;
  avgWeeklyTSS: number;
  recentActivities: Array<{ date: string; tss: number | null; rpe: number | null }>;
  trainingLoad: TrainingLoad;
  ctlPreviousWeek: number;
  lastActivityDate: string | null;
  today: string;
}

/**
 * Ejecuta todas las reglas de alerta y retorna solo las activas (level !== "none").
 */
export function evaluateTrainingAlerts(params: AlertParams): TrainingAlert[] {
  const alerts: TrainingAlert[] = [
    checkOverloadAlert(params.weeklyTSS, params.avgWeeklyTSS),
    checkRestAlert(params.recentActivities),
    checkDetrainingAlert(params.trainingLoad.tsb, params.lastActivityDate, params.today),
    checkRampRateAlert(params.trainingLoad.ctl, params.ctlPreviousWeek),
  ];

  return alerts.filter((a) => a.level !== "none");
}
