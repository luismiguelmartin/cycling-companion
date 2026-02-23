import Link from "next/link";
import { Activity, Clock, Zap, Heart, ChevronRight } from "lucide-react";
import { apiGet, getServerToken } from "@/lib/api/server";
import { KPICard } from "@/components/kpi-card";
import { AICoachCardClient } from "@/components/ai-coach-card-client";
import { OverloadAlert } from "@/components/overload-alert";
import { RecentActivityItem } from "@/components/recent-activity-item";
import { PowerTrendChart } from "@/components/charts/power-trend-chart";
import { DailyLoadChart } from "@/components/charts/daily-load-chart";
import { DashboardEmptyActions } from "@/components/dashboard-empty-actions";
import {
  calculateWeeklyKPIs,
  calculateTrends,
  calculateWeeklyTrend,
  calculateDailyLoad,
  formatDuration,
  getWeekNumber,
  getWeekStart,
  getGreeting,
} from "@/lib/dashboard/calculations";

interface ProfileData {
  data: {
    display_name: string;
    ftp: number | null;
    max_hr: number | null;
    goal: string;
  };
}

interface ActivityRow {
  id: string;
  name: string;
  date: string;
  type: string;
  duration_seconds: number;
  distance_km: number | null;
  avg_power_watts: number | null;
  avg_hr_bpm: number | null;
  tss: number | null;
}

interface ActivitiesResponse {
  data: ActivityRow[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface OverloadResponse {
  data: {
    currentLoad: number;
    avgLoad: number;
    percentage: number;
    is_overloaded: boolean;
    alert_level: "none" | "warning" | "critical";
  };
}

export default async function DashboardPage() {
  const token = await getServerToken();
  if (!token) return null;

  // Obtener actividades de las últimas 4 semanas
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const dateFrom = fourWeeksAgo.toISOString().split("T")[0];

  const [profileRes, activitiesRes, overloadRes] = await Promise.all([
    apiGet<ProfileData>("/profile", token),
    apiGet<ActivitiesResponse>(`/activities?date_from=${dateFrom}&limit=100`, token),
    apiGet<OverloadResponse>("/insights/overload-check", token).catch(() => null),
  ]);

  const profile = profileRes.data;
  const allActivities = activitiesRes.data;

  // Calcular rangos de semana (UTC para consistencia con fechas de actividad)
  const now = new Date();
  const currentWeekStart = getWeekStart(now);
  const currentWeekEnd = new Date(currentWeekStart.getTime());
  currentWeekEnd.setUTCDate(currentWeekEnd.getUTCDate() + 6);
  currentWeekEnd.setUTCHours(23, 59, 59, 999);

  const previousWeekStart = new Date(currentWeekStart.getTime());
  previousWeekStart.setUTCDate(previousWeekStart.getUTCDate() - 7);
  const previousWeekEnd = new Date(currentWeekStart.getTime() - 1);

  // KPIs
  const currentKPIs = calculateWeeklyKPIs(allActivities, currentWeekStart, currentWeekEnd);
  const previousKPIs = calculateWeeklyKPIs(allActivities, previousWeekStart, previousWeekEnd);
  const trends = calculateTrends(currentKPIs, previousKPIs);

  // Gráficas
  const weeklyTrend = calculateWeeklyTrend(allActivities);
  const dailyLoad = calculateDailyLoad(allActivities, currentWeekStart);

  // Sobrecarga desde API
  const overload = overloadRes?.data?.is_overloaded
    ? { currentLoad: overloadRes.data.currentLoad, avgLoad: overloadRes.data.avgLoad }
    : null;

  // Actividades recientes (máx 4)
  const recentActivities = allActivities.slice(0, 4);

  // Datos del Dashboard
  const weekNumber = getWeekNumber(now);
  const greeting = getGreeting();
  const userName = profile?.display_name ?? "Ciclista";

  // Fallback estático para el coach tip (se usa si la llamada client-side falla)
  const fallbackRecommendation =
    allActivities.length > 0
      ? `Tu semana lleva ${currentKPIs.activityCount} actividad${currentKPIs.activityCount !== 1 ? "es" : ""}. ${
          currentKPIs.avgPower
            ? `Tu potencia media es ${currentKPIs.avgPower}W.`
            : "Sigue registrando para obtener mejores insights."
        } ¡Mantén la constancia!`
      : "Sube tu primera actividad para empezar a recibir recomendaciones personalizadas. Cuantos más datos tenga, mejores serán mis consejos.";

  const fallbackTips =
    allActivities.length > 0
      ? { hydration: "2.5L mínimo", sleep: "7.5h recomendadas", nutrition: "+30g carbohidratos" }
      : undefined;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[var(--text-primary)] md:text-[26px]">
          {greeting}, {userName} 👋
        </h1>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          Semana {weekNumber} · {currentKPIs.activityCount} actividad
          {currentKPIs.activityCount !== 1 ? "es" : ""} esta semana
        </p>
      </div>

      {/* Overload alert */}
      {overload && (
        <div className="mb-4">
          <OverloadAlert currentLoad={overload.currentLoad} avgLoad={overload.avgLoad} />
        </div>
      )}

      {/* KPI Grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <KPICard
          icon={Activity}
          iconColor="#f97316"
          value={currentKPIs.distanceKm > 0 ? String(currentKPIs.distanceKm) : "—"}
          unit="km"
          label="Distancia"
          trend={trends.distance ?? undefined}
        />
        <KPICard
          icon={Clock}
          iconColor="#8b5cf6"
          value={
            currentKPIs.durationSeconds > 0 ? formatDuration(currentKPIs.durationSeconds) : "—"
          }
          unit="h"
          label="Tiempo"
          trend={trends.duration ?? undefined}
        />
        <KPICard
          icon={Zap}
          iconColor="#22c55e"
          value={currentKPIs.avgPower != null ? String(currentKPIs.avgPower) : "—"}
          unit="W"
          label="Potencia media"
          trend={trends.power ?? undefined}
        />
        <KPICard
          icon={Heart}
          iconColor="#ef4444"
          value={currentKPIs.avgHR != null ? String(currentKPIs.avgHR) : "—"}
          unit="bpm"
          label="FC media"
          trend={trends.hr ?? undefined}
        />
      </div>

      {/* Charts */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <PowerTrendChart data={weeklyTrend} />
        <DailyLoadChart data={dailyLoad} />
      </div>

      {/* AI Coach Card */}
      <div className="mb-6">
        <AICoachCardClient
          fallbackRecommendation={fallbackRecommendation}
          fallbackTips={fallbackTips}
        />
      </div>

      {/* Recent Activities */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-[var(--text-primary)]">
            Actividades recientes
          </h2>
          {recentActivities.length > 0 && (
            <Link
              href="/activities"
              className="flex items-center gap-1 text-[13px] font-medium text-[var(--accent)]"
            >
              Ver todas
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {recentActivities.length > 0 ? (
          <div className="flex flex-col gap-2">
            {recentActivities.map((activity) => (
              <RecentActivityItem
                key={activity.id}
                id={activity.id}
                name={activity.name}
                date={activity.date}
                type={activity.type}
                distanceKm={activity.distance_km}
                durationSeconds={activity.duration_seconds}
                avgPower={activity.avg_power_watts}
                avgHR={activity.avg_hr_bpm}
              />
            ))}
          </div>
        ) : (
          <DashboardEmptyActions />
        )}
      </div>
    </div>
  );
}
