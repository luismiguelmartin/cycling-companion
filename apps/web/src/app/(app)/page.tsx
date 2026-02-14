import Link from "next/link";
import { Activity, Clock, Zap, Heart, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { KPICard } from "@/components/kpi-card";
import { AICoachCard } from "@/components/ai-coach-card";
import { OverloadAlert } from "@/components/overload-alert";
import { RecentActivityItem } from "@/components/recent-activity-item";
import { PowerTrendChart } from "@/components/charts/power-trend-chart";
import { DailyLoadChart } from "@/components/charts/daily-load-chart";
import {
  calculateWeeklyKPIs,
  calculateTrends,
  calculateWeeklyTrend,
  calculateDailyLoad,
  detectOverload,
  formatDuration,
  getWeekNumber,
  getWeekStart,
  getGreeting,
} from "@/lib/dashboard/calculations";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Obtener perfil del usuario
  const { data: profile } = await supabase
    .from("users")
    .select("display_name, ftp, max_hr, goal")
    .eq("id", user!.id)
    .single();

  // Obtener actividades de las últimas 4 semanas
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const { data: activities } = await supabase
    .from("activities")
    .select("id, name, date, type, duration_seconds, distance_km, avg_power_watts, avg_hr_bpm, tss")
    .eq("user_id", user!.id)
    .gte("date", fourWeeksAgo.toISOString().split("T")[0])
    .order("date", { ascending: false });

  const allActivities = activities ?? [];

  // Calcular rangos de semana
  const now = new Date();
  const currentWeekStart = getWeekStart(now);
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);
  currentWeekEnd.setHours(23, 59, 59, 999);

  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);
  const previousWeekEnd = new Date(currentWeekStart);
  previousWeekEnd.setMilliseconds(-1);

  // KPIs
  const currentKPIs = calculateWeeklyKPIs(allActivities, currentWeekStart, currentWeekEnd);
  const previousKPIs = calculateWeeklyKPIs(allActivities, previousWeekStart, previousWeekEnd);
  const trends = calculateTrends(currentKPIs, previousKPIs);

  // Gráficas
  const weeklyTrend = calculateWeeklyTrend(allActivities);
  const dailyLoad = calculateDailyLoad(allActivities, currentWeekStart);

  // Sobrecarga
  const overload = detectOverload(allActivities);

  // Actividades recientes (máx 4)
  const recentActivities = allActivities.slice(0, 4);

  // Datos del Dashboard
  const weekNumber = getWeekNumber(now);
  const greeting = getGreeting();
  const userName = profile?.display_name ?? "Ciclista";

  // Recomendación IA placeholder
  const aiRecommendation =
    allActivities.length > 0
      ? `Tu semana lleva ${currentKPIs.activityCount} actividad${currentKPIs.activityCount !== 1 ? "es" : ""}. ${
          currentKPIs.avgPower
            ? `Tu potencia media es ${currentKPIs.avgPower}W.`
            : "Sigue registrando para obtener mejores insights."
        } ¡Mantén la constancia!`
      : "Sube tu primera actividad para empezar a recibir recomendaciones personalizadas. Cuantos más datos tenga, mejores serán mis consejos. 🚴‍♂️";

  return (
    <div className="p-4 md:p-8">
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
        <AICoachCard
          recommendation={aiRecommendation}
          tips={
            allActivities.length > 0
              ? {
                  hydration: "2.5L mínimo",
                  sleep: "7.5h recomendadas",
                  nutrition: "+30g carbohidratos",
                }
              : undefined
          }
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
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 text-center">
            <p className="text-[13px] text-[var(--text-muted)]">
              Aún no tienes actividades registradas. ¡Importa tu primera sesión!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
