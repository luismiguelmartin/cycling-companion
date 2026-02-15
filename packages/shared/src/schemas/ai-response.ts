import { z } from "zod";
import { activityTypeEnum } from "./activity";

/** Análisis post-sesión — usado por AIAnalysisCard */
export const aiActivityAnalysisSchema = z.object({
  summary: z.string(),
  recommendation: z.string(),
  tips: z.object({
    hydration: z.string().optional(),
    nutrition: z.string().optional(),
    sleep: z.string().optional(),
  }),
});
export type AIActivityAnalysis = z.infer<typeof aiActivityAnalysisSchema>;

/** Tip diario del coach — usado por AICoachCard */
export const aiCoachTipSchema = z.object({
  recommendation: z.string(),
  tips: z
    .object({
      hydration: z.string().optional(),
      sleep: z.string().optional(),
      nutrition: z.string().optional(),
    })
    .optional(),
});
export type AICoachTip = z.infer<typeof aiCoachTipSchema>;

/** Resumen comparativo semanal — usado por AIInsightsCard */
export const aiWeeklySummarySchema = z.object({
  summary: z.string(),
  alert: z.string().optional(),
  recommendation: z.string(),
});
export type AIWeeklySummary = z.infer<typeof aiWeeklySummarySchema>;

/** Día de plan generado por IA (sin done/actual_power, que se añaden al persistir) */
export const aiPlanDaySchema = z.object({
  day: z.string(),
  date: z.string(),
  type: activityTypeEnum,
  title: z.string(),
  intensity: z.enum(["alta", "media-alta", "media", "baja", "—"]),
  duration: z.string(),
  description: z.string(),
  nutrition: z.string(),
  rest: z.string(),
});

/** Respuesta completa de generación de plan semanal */
export const aiWeeklyPlanResponseSchema = z.object({
  days: z.array(aiPlanDaySchema).length(7),
  rationale: z.string(),
});
export type AIWeeklyPlanResponse = z.infer<typeof aiWeeklyPlanResponseSchema>;
