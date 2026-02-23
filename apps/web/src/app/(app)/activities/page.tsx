import { apiGet, getServerToken } from "@/lib/api/server";
import { ActivitiesContent } from "./activities-content";

interface ActivityRow {
  id: string;
  name: string;
  date: string;
  type: string;
  distance_km: number | null;
  duration_seconds: number;
  avg_power_watts: number | null;
  avg_hr_bpm: number | null;
  rpe: number | null;
}

interface ActivitiesResponse {
  data: ActivityRow[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export default async function ActivitiesPage() {
  const token = await getServerToken();
  if (!token) return null;

  let activities: ActivityRow[] = [];
  try {
    const res = await apiGet<ActivitiesResponse>("/activities?limit=200", token);
    activities = res.data;
  } catch {
    // API no disponible — mostrar lista vacía
  }

  return <ActivitiesContent activities={activities} />;
}
