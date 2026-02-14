import { z } from "zod";

export const goalEnum = z.enum(["performance", "health", "weight_loss", "recovery"]);
export type GoalType = z.infer<typeof goalEnum>;

export const onboardingSchema = z.object({
  display_name: z.string().min(1, "El nombre es obligatorio").max(100),
  age: z.number().int().positive().max(119),
  weight_kg: z.number().positive().max(299.9),
  ftp: z.number().int().positive().max(999).nullable().optional(),
  max_hr: z.number().int().positive().max(249).nullable().optional(),
  rest_hr: z.number().int().positive().max(199).nullable().optional(),
  goal: goalEnum,
});
export type OnboardingData = z.infer<typeof onboardingSchema>;

export const userProfileSchema = onboardingSchema.extend({
  id: z.string().uuid(),
  email: z.string().email(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;
