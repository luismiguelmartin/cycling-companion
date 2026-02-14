import { z } from "zod";

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
