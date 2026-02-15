import type { UserProfile } from "shared";
import { onboardingSchema } from "shared";
import type { OnboardingData } from "shared";
import { supabaseAdmin } from "./supabase.js";
import { AppError } from "../plugins/error-handler.js";

export async function getProfile(userId: string): Promise<UserProfile> {
  const { data, error } = await supabaseAdmin.from("users").select("*").eq("id", userId).single();

  if (error || !data) {
    throw new AppError("Profile not found", 404, "NOT_FOUND");
  }

  return data as UserProfile;
}

export async function updateProfile(
  userId: string,
  data: Partial<OnboardingData>,
): Promise<UserProfile> {
  const parsedData = onboardingSchema.partial().parse(data);

  const { data: updated, error } = await supabaseAdmin
    .from("users")
    .update(parsedData)
    .eq("id", userId)
    .select()
    .single();

  if (error || !updated) {
    throw new AppError("Profile not found", 404, "NOT_FOUND");
  }

  return updated as UserProfile;
}
