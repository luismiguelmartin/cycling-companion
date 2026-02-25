import { z } from "zod";

/** Origen de la actividad */
export const activitySourceEnum = z.enum(["manual", "upload", "strava"]);
export type ActivitySource = z.infer<typeof activitySourceEnum>;

/** Estado de la conexión Strava (respuesta al frontend) */
export const stravaConnectionStatusSchema = z.object({
  connected: z.boolean(),
  athlete_name: z.string().nullable(),
  strava_athlete_id: z.number().nullable(),
  connected_at: z.string().datetime().nullable(),
  last_sync_at: z.string().datetime().nullable(),
  activities_count: z.number().int().nonnegative(),
});

export type StravaConnectionStatus = z.infer<typeof stravaConnectionStatusSchema>;

/** Resultado de sincronización / backfill */
export const stravaSyncResultSchema = z.object({
  imported: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  errors: z.number().int().nonnegative(),
});

export type StravaSyncResult = z.infer<typeof stravaSyncResultSchema>;
