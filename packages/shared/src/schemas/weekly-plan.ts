import { z } from "zod";
import { activityTypeEnum } from "./activity";

const intensityLevelEnum = z.enum(["alta", "media-alta", "media", "baja", "—"]);

export const planDaySchema = z.object({
  day: z.string(),
  date: z.string(),
  type: activityTypeEnum,
  title: z.string(),
  intensity: intensityLevelEnum,
  duration: z.string(),
  description: z.string(),
  nutrition: z.string(),
  rest: z.string(),
  done: z.boolean(),
  actual_power: z.number().nullable(),
});

export type PlanDay = z.infer<typeof planDaySchema>;

export const weeklyPlanSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  week_start: z.string(),
  days: z.array(planDaySchema),
  total_tss: z.number().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type WeeklyPlan = z.infer<typeof weeklyPlanSchema>;
