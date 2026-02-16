import type { PlanDay } from "shared";
import { supabaseAdmin } from "./supabase.js";
import { AppError } from "../plugins/error-handler.js";

export interface WeeklyPlanRow {
  id: string;
  user_id: string;
  week_start: string;
  plan_data: { days: PlanDay[] };
  ai_rationale: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyPlanResponse {
  id: string;
  user_id: string;
  week_start: string;
  days: PlanDay[];
  ai_rationale: string | null;
  created_at: string;
  updated_at: string;
}

function mapRowToResponse(row: WeeklyPlanRow): WeeklyPlanResponse {
  return {
    id: row.id,
    user_id: row.user_id,
    week_start: row.week_start,
    days: row.plan_data.days,
    ai_rationale: row.ai_rationale,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function getWeekStart(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayOfWeek = d.getUTCDay();
  const diff = d.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  d.setUTCDate(diff);
  return d.toISOString().slice(0, 10);
}

export async function getPlan(
  userId: string,
  weekStart?: string,
): Promise<WeeklyPlanResponse | null> {
  const effectiveWeekStart = weekStart ?? getWeekStart(new Date());

  const { data, error } = await supabaseAdmin
    .from("weekly_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start", effectiveWeekStart)
    .single();

  if (error || !data) return null;

  return mapRowToResponse(data as WeeklyPlanRow);
}

export async function updatePlan(
  userId: string,
  weekStart: string,
  days: PlanDay[],
): Promise<WeeklyPlanResponse> {
  const { data, error } = await supabaseAdmin
    .from("weekly_plans")
    .update({ plan_data: { days } })
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .select("*")
    .single();

  if (error || !data) {
    throw new AppError("Plan no encontrado", 404, "NOT_FOUND");
  }

  return mapRowToResponse(data as WeeklyPlanRow);
}

export async function deletePlan(userId: string, weekStart: string): Promise<void> {
  const { error, count } = await supabaseAdmin
    .from("weekly_plans")
    .delete()
    .eq("user_id", userId)
    .eq("week_start", weekStart);

  if (error || count === 0) {
    throw new AppError("Plan no encontrado", 404, "NOT_FOUND");
  }
}
