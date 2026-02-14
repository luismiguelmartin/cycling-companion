import { z } from "zod";

export const periodRangeSchema = z.object({
  start: z.string(),
  end: z.string(),
  label: z.string(),
});

export const comparisonMetricSchema = z.object({
  metric: z.string(),
  valueA: z.number(),
  valueB: z.number(),
  unit: z.string(),
  color: z.string(),
  inverse: z.boolean().optional(),
});

export const radarDimensionSchema = z.object({
  metric: z.string(),
  A: z.number(),
  B: z.number(),
});

export const insightsAnalysisSchema = z.object({
  summary: z.string(),
  alert: z.string().optional(),
  recommendation: z.string(),
});

export type PeriodRange = z.infer<typeof periodRangeSchema>;
export type ComparisonMetric = z.infer<typeof comparisonMetricSchema>;
export type RadarDimension = z.infer<typeof radarDimensionSchema>;
export type InsightsAnalysis = z.infer<typeof insightsAnalysisSchema>;
