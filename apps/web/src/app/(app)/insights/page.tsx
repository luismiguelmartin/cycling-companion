import { createClient } from "@/lib/supabase/server";
import { getDefaultPeriods } from "@/lib/insights/periods";
import {
  calculatePeriodMetrics,
  buildComparisonMetrics,
  calculateRadarDimensions,
  generateSimpleAnalysis,
} from "@/lib/insights/calculations";
import { InsightsContent } from "./insights-content";

export default async function InsightsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { periodA, periodB } = getDefaultPeriods();

  // Query activities for period A
  const { data: activitiesA } = await supabase
    .from("activities")
    .select("date, duration_seconds, distance_km, avg_power_watts, avg_hr_bpm, tss")
    .eq("user_id", user!.id)
    .gte("date", periodA.start)
    .lte("date", periodA.end)
    .order("date", { ascending: true });

  // Query activities for period B
  const { data: activitiesB } = await supabase
    .from("activities")
    .select("date, duration_seconds, distance_km, avg_power_watts, avg_hr_bpm, tss")
    .eq("user_id", user!.id)
    .gte("date", periodB.start)
    .lte("date", periodB.end)
    .order("date", { ascending: true });

  const rowsA = activitiesA ?? [];
  const rowsB = activitiesB ?? [];

  // Calculate metrics
  const metricsA = calculatePeriodMetrics(rowsA);
  const metricsB = calculatePeriodMetrics(rowsB);

  const comparisonMetrics = buildComparisonMetrics(metricsA, metricsB);
  const radarDimensions = calculateRadarDimensions(metricsA, metricsB);
  const analysis = generateSimpleAnalysis(metricsA, metricsB);

  const isEmpty = metricsA.sessionCount === 0 && metricsB.sessionCount === 0;

  return (
    <InsightsContent
      periodA={periodA}
      periodB={periodB}
      comparisonMetrics={comparisonMetrics}
      radarDimensions={radarDimensions}
      analysis={analysis}
      isEmpty={isEmpty}
    />
  );
}
