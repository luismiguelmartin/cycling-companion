import { z } from "zod";
import { activitySourceEnum } from "./strava.js";

export const activityTypeEnum = z.enum(["intervals", "endurance", "recovery", "tempo", "rest"]);
export type ActivityType = z.infer<typeof activityTypeEnum>;

export const activitySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1),
  date: z.string(),
  type: activityTypeEnum,
  duration_seconds: z.number().int().positive(),
  distance_km: z.number().nonnegative().nullable(),
  avg_power_watts: z.number().int().nonnegative().nullable(),
  avg_hr_bpm: z.number().int().positive().max(220).nullable(),
  max_hr_bpm: z.number().int().positive().max(220).nullable(),
  avg_cadence_rpm: z.number().int().nonnegative().nullable(),
  tss: z.number().int().nonnegative().nullable(),
  rpe: z.number().int().min(1).max(10).nullable(),
  ai_analysis: z.any().nullable(),
  notes: z.string().nullable(),
  is_reference: z.boolean(),
  raw_file_url: z.string().nullable(),
  // Strava integration
  strava_id: z.number().int().positive().nullable(),
  source: activitySourceEnum.default("manual"),
  // Métricas avanzadas v2 (nullable para retrocompatibilidad)
  duration_moving: z.number().int().positive().nullable(),
  normalized_power: z.number().int().nonnegative().nullable(),
  max_power: z.number().int().nonnegative().nullable(),
  max_speed: z.number().nonnegative().nullable(),
  avg_speed: z.number().nonnegative().nullable(),
  avg_power_non_zero: z.number().int().nonnegative().nullable(),
  variability_index: z.number().nonnegative().nullable(),
  intensity_factor: z.number().nonnegative().nullable(),
  elevation_gain: z.number().int().nonnegative().nullable(),
  avg_hr_moving: z.number().int().positive().max(220).nullable(),
  avg_cadence_moving: z.number().int().nonnegative().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Activity = z.infer<typeof activitySchema>;

export const activityCreateSchema = activitySchema
  .omit({
    id: true,
    user_id: true,
    tss: true,
    ai_analysis: true,
    is_reference: true,
    raw_file_url: true,
    strava_id: true,
    source: true,
    duration_moving: true,
    normalized_power: true,
    max_power: true,
    max_speed: true,
    avg_speed: true,
    avg_power_non_zero: true,
    variability_index: true,
    intensity_factor: true,
    elevation_gain: true,
    avg_hr_moving: true,
    avg_cadence_moving: true,
    created_at: true,
    updated_at: true,
  })
  .extend({
    distance_km: z.number().positive().nullable().default(null),
    avg_power_watts: z.number().int().positive().nullable().default(null),
    avg_hr_bpm: z.number().int().positive().max(220).nullable().default(null),
    max_hr_bpm: z.number().int().positive().max(220).nullable().default(null),
    avg_cadence_rpm: z.number().int().positive().nullable().default(null),
    rpe: z.number().int().min(1).max(10).nullable().default(null),
    notes: z.string().nullable().default(null),
  });

export type ActivityCreate = z.infer<typeof activityCreateSchema>;
export type ActivityCreateInput = z.input<typeof activityCreateSchema>;
