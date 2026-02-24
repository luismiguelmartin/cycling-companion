import {
  activityCreateSchema,
  type Activity,
  type ActivityCreateInput,
  type ActivitySummary,
} from "shared";
import { supabaseAdmin } from "./supabase.js";
import { AppError } from "../plugins/error-handler.js";

export interface ListActivitiesParams {
  userId: string;
  page?: number;
  limit?: number;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ActivityMetric {
  id: string;
  activity_id: string;
  timestamp_seconds: number;
  power_watts: number | null;
  hr_bpm: number | null;
  cadence_rpm: number | null;
  speed_kmh: number | null;
}

export async function listActivities(
  params: ListActivitiesParams,
): Promise<PaginatedResult<Activity>> {
  const { userId, page = 1, limit = 20, type, dateFrom, dateTo, search } = params;

  let query = supabaseAdmin
    .from("activities")
    .select("*", { count: "exact" })
    .eq("user_id", userId);

  if (type) {
    query = query.eq("type", type);
  }

  if (dateFrom) {
    query = query.gte("date", dateFrom);
  }

  if (dateTo) {
    query = query.lte("date", dateTo);
  }

  if (search) {
    // Sanitizar: escapar caracteres especiales de ILIKE y limitar longitud
    const sanitized = search.slice(0, 100).replace(/[%_\\]/g, "\\$&");
    query = query.or(`name.ilike.%${sanitized}%,notes.ilike.%${sanitized}%`);
  }

  const offset = (page - 1) * limit;
  query = query.order("date", { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new AppError(`Failed to fetch activities: ${error.message}`, 500, "DATABASE_ERROR");
  }

  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit);

  return {
    data: (data ?? []) as Activity[],
    meta: { page, limit, total, totalPages },
  };
}

export async function getActivity(userId: string, activityId: string): Promise<Activity> {
  const { data, error } = await supabaseAdmin
    .from("activities")
    .select("*")
    .eq("id", activityId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw new AppError("Activity not found", 404, "NOT_FOUND");
  }

  return data as Activity;
}

export async function createActivity(
  userId: string,
  data: ActivityCreateInput,
  userFtp?: number | null,
  normalizedPowerWatts?: number | null,
  summary?: ActivitySummary,
): Promise<Activity> {
  const parsedData = activityCreateSchema.parse(data);

  // TSS: preferir el del summary si existe, sino calcular manualmente
  let tss: number | null = null;
  if (summary?.tss != null) {
    tss = summary.tss;
  } else {
    const powerForTSS = normalizedPowerWatts ?? parsedData.avg_power_watts;
    if (powerForTSS && userFtp) {
      const intensityFactor = powerForTSS / userFtp;
      const durationHours = parsedData.duration_seconds / 3600;
      tss = Math.round(intensityFactor * intensityFactor * durationHours * 100);
    }
  }

  const { data: activity, error } = await supabaseAdmin
    .from("activities")
    .insert({
      ...parsedData,
      user_id: userId,
      tss,
      // Métricas avanzadas v2 (null si no hay summary)
      duration_moving: summary?.duration_moving ?? null,
      normalized_power:
        summary?.normalized_power != null ? Math.round(summary.normalized_power) : null,
      max_power: summary?.max_power != null ? Math.round(summary.max_power) : null,
      max_speed: summary?.max_speed != null ? Math.round(summary.max_speed * 100) / 100 : null,
      avg_speed: summary?.avg_speed != null ? Math.round(summary.avg_speed * 100) / 100 : null,
      avg_power_non_zero:
        summary?.avg_power_non_zero != null ? Math.round(summary.avg_power_non_zero) : null,
      variability_index:
        summary?.variability_index != null
          ? Math.round(summary.variability_index * 100) / 100
          : null,
      intensity_factor:
        summary?.intensity_factor != null ? Math.round(summary.intensity_factor * 100) / 100 : null,
      elevation_gain: summary?.elevation_gain != null ? Math.round(summary.elevation_gain) : null,
      avg_hr_moving: summary?.avg_hr_moving != null ? Math.round(summary.avg_hr_moving) : null,
      avg_cadence_moving:
        summary?.avg_cadence_moving != null ? Math.round(summary.avg_cadence_moving) : null,
    })
    .select()
    .single();

  if (error || !activity) {
    throw new AppError(`Failed to create activity: ${error?.message}`, 500, "DATABASE_ERROR");
  }

  return activity as Activity;
}

export async function updateActivity(
  userId: string,
  activityId: string,
  data: Partial<ActivityCreateInput>,
): Promise<Activity> {
  const parsedData = activityCreateSchema.partial().parse(data);

  const { data: activity, error } = await supabaseAdmin
    .from("activities")
    .update(parsedData)
    .eq("id", activityId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !activity) {
    throw new AppError("Activity not found", 404, "NOT_FOUND");
  }

  return activity as Activity;
}

export async function deleteActivity(userId: string, activityId: string): Promise<void> {
  const { error, count } = await supabaseAdmin
    .from("activities")
    .delete({ count: "exact" })
    .eq("id", activityId)
    .eq("user_id", userId);

  if (error) {
    throw new AppError(`Failed to delete activity: ${error.message}`, 500, "DATABASE_ERROR");
  }

  if (count === 0) {
    throw new AppError("Activity not found", 404, "NOT_FOUND");
  }
}

export async function getActivityMetrics(
  userId: string,
  activityId: string,
): Promise<ActivityMetric[]> {
  await getActivity(userId, activityId);

  const { data, error } = await supabaseAdmin
    .from("activity_metrics")
    .select("*")
    .eq("activity_id", activityId)
    .order("timestamp_seconds", { ascending: true });

  if (error) {
    throw new AppError(`Failed to fetch activity metrics: ${error.message}`, 500, "DATABASE_ERROR");
  }

  return (data ?? []) as ActivityMetric[];
}
