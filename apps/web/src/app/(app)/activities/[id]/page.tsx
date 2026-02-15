import { notFound } from "next/navigation";
import { Activity, Clock, Zap, Heart, TrendingUp } from "lucide-react";
import { apiGet, getServerToken } from "@/lib/api/server";
import { formatDuration } from "@/lib/dashboard/calculations";
import { formatActivityDate } from "@/lib/activities/format-date";
import { transformTimeSeries } from "@/lib/activities/transform-time-series";
import { BackButton } from "@/components/back-button";
import { MetricsGrid, type MetricItem } from "@/components/metrics-grid";
import { ActivityChart } from "@/components/charts/activity-chart";
import { AIAnalysisCard } from "@/components/ai-analysis-card";
import { DetailHeader } from "./detail-header";

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

  const timeSeries = transformTimeSeries(metricsRows);
  const dateFormatted = formatActivityDate(activity.date);

  const metrics: MetricItem[] = [
    {
      icon: <Activity className="h-3 w-3" style={{ color: "#3b82f6" }} />,
      label: "Dist.",
      value: activity.distance_km != null ? activity.distance_km.toFixed(1) : "—",
      unit: activity.distance_km != null ? "km" : "",
    },
    {
      icon: <Clock className="h-3 w-3" style={{ color: "#8b5cf6" }} />,
      label: "Tiempo",
      value: formatDuration(activity.duration_seconds),
      unit: "",
    },
    {
      icon: <Zap className="h-3 w-3" style={{ color: "#f97316" }} />,
      label: "Pot.",
      value: activity.avg_power_watts != null ? String(activity.avg_power_watts) : "—",
      unit: activity.avg_power_watts != null ? "W" : "",
    },
    {
      icon: <Heart className="h-3 w-3" style={{ color: "#ef4444" }} />,
      label: "FC",
      value: activity.avg_hr_bpm != null ? String(activity.avg_hr_bpm) : "—",
      unit: activity.avg_hr_bpm != null ? "bpm" : "",
    },
    {
      icon: <TrendingUp className="h-3 w-3" style={{ color: "#22c55e" }} />,
      label: "Cadencia",
      value: activity.avg_cadence_rpm != null ? String(activity.avg_cadence_rpm) : "—",
      unit: activity.avg_cadence_rpm != null ? "rpm" : "",
    },
    {
      icon: <Zap className="h-3 w-3" style={{ color: "#eab308" }} />,
      label: "TSS",
      value: activity.tss != null ? String(activity.tss) : "—",
      unit: "",
    },
  ];

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
      <DetailHeader name={activity.name} type={activity.type} dateFormatted={dateFormatted} />
      <MetricsGrid metrics={metrics} />
      <ActivityChart data={timeSeries} />
      <AIAnalysisCard analysis={analysis} activityId={activity.id} />
    </div>
  );
}
