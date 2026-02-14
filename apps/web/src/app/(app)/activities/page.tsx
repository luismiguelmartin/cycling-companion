import { createClient } from "@/lib/supabase/server";
import { ActivitiesContent } from "./activities-content";

export default async function ActivitiesPage() {
  const supabase = await createClient();

  const { data: activities } = await supabase
    .from("activities")
    .select("id, name, date, type, distance_km, duration_seconds, avg_power_watts, avg_hr_bpm, rpe")
    .order("date", { ascending: false });

  return <ActivitiesContent activities={activities ?? []} />;
}
