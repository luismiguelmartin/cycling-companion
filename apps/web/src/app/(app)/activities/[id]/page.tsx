import { notFound } from "next/navigation";
import { Activity, Clock, Zap, Heart, TrendingUp, Gauge, Mountain, Flame } from "lucide-react";
import { apiGet, getServerToken } from "@/lib/api/server";
import { formatDuration } from "@/lib/dashboard/calculations";
import { formatActivityDate } from "@/lib/activities/format-date";
import { transformTimeSeries } from "@/lib/activities/transform-time-series";
import { BackButton } from "@/components/back-button";
import { MetricsGrid, type MetricItem } from "@/components/metrics-grid";
import { ActivityChart } from "@/components/charts/activity-chart";
import { AIAnalysisCard } from "@/components/ai-analysis-card";
import { ZoneDistributionChart } from "@/components/charts/zone-distribution-chart";
import { BestEffortsTable } from "@/components/best-efforts-table";
import { DetailHeader } from "./detail-header";
import { DeleteActivityButton } from "./delete-activity-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface ActivityData {
  id: string;
  name: string;
  date: string;
  type: string;
  distance_km: number | null;
  duration_seconds: number;
  avg_power_watts: number | null;
  avg_hr_bpm: number | null;
  avg_cadence_rpm: number | null;
  tss: number | null;
  ai_analysis: Record<string, unknown> | null;
  // Métricas v2 (nullable para retrocompatibilidad)
  duration_moving: number | null;
  normalized_power: number | null;
  max_power: number | null;
  max_speed: number | null;
  avg_speed: number | null;
  avg_power_non_zero: number | null;
  variability_index: number | null;
  intensity_factor: number | null;
  elevation_gain: number | null;
  avg_hr_moving: number | null;
  avg_cadence_moving: number | null;
  // Strava
  source: string;
  strava_id: number | null;
  // Fase 3
  power_zone_distribution: Array<{
    zone: string;
    name: string;
    seconds: number;
    percentage: number;
    color: string;
  }> | null;
  hr_zone_distribution: Array<{
    zone: string;
    name: string;
    seconds: number;
    percentage: number;
    color: string;
  }> | null;
  best_efforts: Array<{
    windowSeconds: number;
    label: string;
    power: number;
  }> | null;
}

interface MetricRow {
  timestamp_seconds: number;
  power_watts: number | null;
  hr_bpm: number | null;
  cadence_rpm: number | null;
  speed_kmh: number | null;
}

export default async function ActivityDetailPage({ params }: PageProps) {
  const { id } = await params;
  const token = await getServerToken();
  if (!token) return null;

  let activity: ActivityData;
  try {
    const res = await apiGet<{ data: ActivityData }>(`/activities/${id}`, token);
    activity = res.data;
  } catch {
    notFound();
  }

  let metricsRows: MetricRow[] = [];
  try {
    const metricsRes = await apiGet<{ data: MetricRow[] }>(`/activities/${id}/metrics`, token);
    metricsRows = metricsRes.data;
  } catch {
    // No metrics available
  }

  const timeSeries = transformTimeSeries(metricsRows, activity.distance_km);
  const dateFormatted = formatActivityDate(activity.date);

  const movingDuration = activity.duration_moving ?? activity.duration_seconds;
  const power = activity.avg_power_non_zero ?? activity.avg_power_watts;
  const hr = activity.avg_hr_moving ?? activity.avg_hr_bpm;
  const cadence = activity.avg_cadence_moving ?? activity.avg_cadence_rpm;

  const metrics: MetricItem[] = [
    {
      icon: <Activity className="h-3 w-3" style={{ color: "#3b82f6" }} />,
      label: "Dist.",
      value: activity.distance_km != null ? activity.distance_km.toFixed(1) : "—",
      unit: activity.distance_km != null ? "km" : "",
    },
    {
      icon: <Clock className="h-3 w-3" style={{ color: "#8b5cf6" }} />,
      label: "T. mov.",
      value: formatDuration(movingDuration),
      unit: "",
    },
    {
      icon: <Zap className="h-3 w-3" style={{ color: "#f97316" }} />,
      label: "Pot.",
      value: power != null ? String(power) : "—",
      unit: power != null ? "W" : "",
    },
    {
      icon: <Heart className="h-3 w-3" style={{ color: "#ef4444" }} />,
      label: "FC",
      value: hr != null ? String(hr) : "—",
      unit: hr != null ? "bpm" : "",
    },
    {
      icon: <TrendingUp className="h-3 w-3" style={{ color: "#22c55e" }} />,
      label: "Cadencia",
      value: cadence != null ? String(cadence) : "—",
      unit: cadence != null ? "rpm" : "",
    },
    {
      icon: <Zap className="h-3 w-3" style={{ color: "#eab308" }} />,
      label: "TSS",
      value: activity.tss != null ? String(activity.tss) : "—",
      unit: "",
    },
  ];

  const hasAdvancedMetrics = activity.duration_moving != null || activity.normalized_power != null;

  const advancedMetrics: MetricItem[] = hasAdvancedMetrics
    ? [
        {
          icon: <Gauge className="h-3 w-3" style={{ color: "#3b82f6" }} />,
          label: "Vel. media",
          value: activity.avg_speed != null ? activity.avg_speed.toFixed(1) : "—",
          unit: activity.avg_speed != null ? "km/h" : "",
        },
        {
          icon: <Zap className="h-3 w-3" style={{ color: "#f97316" }} />,
          label: "NP",
          value: activity.normalized_power != null ? String(activity.normalized_power) : "—",
          unit: activity.normalized_power != null ? "W" : "",
        },
        {
          icon: <Zap className="h-3 w-3" style={{ color: "#ef4444" }} />,
          label: "Pot. max.",
          value: activity.max_power != null ? String(activity.max_power) : "—",
          unit: activity.max_power != null ? "W" : "",
        },
        {
          icon: <Mountain className="h-3 w-3" style={{ color: "#22c55e" }} />,
          label: "Desnivel+",
          value: activity.elevation_gain != null ? String(activity.elevation_gain) : "—",
          unit: activity.elevation_gain != null ? "m" : "",
        },
        {
          icon: <TrendingUp className="h-3 w-3" style={{ color: "#eab308" }} />,
          label: "IF",
          value: activity.intensity_factor != null ? activity.intensity_factor.toFixed(2) : "—",
          unit: "",
        },
        ...(activity.normalized_power != null && hr != null && hr > 0
          ? [
              {
                icon: <Flame className="h-3 w-3" style={{ color: "#f43f5e" }} />,
                label: "EF",
                value: (activity.normalized_power / hr).toFixed(2),
                unit: "",
              },
            ]
          : []),
      ]
    : [];

  // Validate ai_analysis structure
  let analysis = null;
  if (activity.ai_analysis && typeof activity.ai_analysis === "object") {
    const raw = activity.ai_analysis;
    if (typeof raw.summary === "string" && typeof raw.recommendation === "string") {
      const tips = (raw.tips as Record<string, unknown>) ?? {};
      analysis = {
        summary: raw.summary,
        recommendation: raw.recommendation,
        tips: {
          hydration: typeof tips.hydration === "string" ? tips.hydration : undefined,
          nutrition: typeof tips.nutrition === "string" ? tips.nutrition : undefined,
          sleep: typeof tips.sleep === "string" ? tips.sleep : undefined,
        },
      };
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <BackButton />
      <DetailHeader
        name={activity.name}
        type={activity.type}
        dateFormatted={dateFormatted}
        source={activity.source}
        stravaId={activity.strava_id}
        actions={<DeleteActivityButton activityId={activity.id} activityName={activity.name} />}
      />
      <MetricsGrid metrics={metrics} />
      {advancedMetrics.length > 0 && <MetricsGrid metrics={advancedMetrics} />}
      <ActivityChart data={timeSeries} />
      {activity.best_efforts && activity.best_efforts.length > 0 && (
        <BestEffortsTable data={activity.best_efforts} />
      )}
      {(activity.power_zone_distribution?.length || activity.hr_zone_distribution?.length) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          {activity.power_zone_distribution && activity.power_zone_distribution.length > 0 && (
            <ZoneDistributionChart
              data={activity.power_zone_distribution}
              title="Zonas de potencia"
            />
          )}
          {activity.hr_zone_distribution && activity.hr_zone_distribution.length > 0 && (
            <ZoneDistributionChart
              data={activity.hr_zone_distribution}
              title="Zonas de frecuencia cardíaca"
            />
          )}
        </div>
      )}
      <AIAnalysisCard analysis={analysis} activityId={activity.id} />
    </div>
  );
}
