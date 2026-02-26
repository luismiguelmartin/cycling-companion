import { supabaseAdmin } from "./supabase.js";

/**
 * Recalcula TSS, IF y VI para todas las actividades de un usuario
 * cuando cambia su FTP. Usa NP ya persistido — no necesita TrackPoints.
 *
 * @returns Número de actividades actualizadas
 */
export async function recalculateMetricsForUser(userId: string, newFtp: number): Promise<number> {
  if (newFtp <= 0) return 0;

  const { data: activities, error } = await supabaseAdmin
    .from("activities")
    .select("id, normalized_power, duration_seconds, avg_power_watts")
    .eq("user_id", userId)
    .not("normalized_power", "is", null);

  if (error || !activities || activities.length === 0) return 0;

  let updated = 0;

  for (const activity of activities) {
    const np = activity.normalized_power as number;
    const durationSeconds = activity.duration_seconds as number;
    const avgPow = activity.avg_power_watts as number | null;

    const intensityFactor = Math.round((np / newFtp) * 100) / 100;
    const tss = Math.round(intensityFactor * intensityFactor * (durationSeconds / 3600) * 100);
    const vi = avgPow != null && avgPow > 0 ? Math.round((np / avgPow) * 100) / 100 : null;

    const { error: updateError } = await supabaseAdmin
      .from("activities")
      .update({
        intensity_factor: intensityFactor,
        tss,
        variability_index: vi,
      })
      .eq("id", activity.id);

    if (!updateError) updated++;
  }

  return updated;
}
