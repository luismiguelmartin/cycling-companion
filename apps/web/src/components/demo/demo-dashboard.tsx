"use client";

import { Activity, Clock, Zap, Heart, ChevronRight } from "lucide-react";
import { KPICard } from "@/components/kpi-card";
import { AICoachCard } from "@/components/ai-coach-card";
import { OverloadAlert } from "@/components/overload-alert";
import { RecentActivityItem } from "@/components/recent-activity-item";
import { PowerTrendChart } from "@/components/charts/power-trend-chart";
import { DailyLoadChart } from "@/components/charts/daily-load-chart";
import { DEMO_DASHBOARD } from "@/lib/demo/mock-data";

export function DemoDashboard() {
  const d = DEMO_DASHBOARD;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[var(--text-primary)] md:text-[26px]">
          {d.greeting}, {d.userName} 👋
        </h1>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          Semana {d.weekNumber} · {d.activityCount} actividades esta semana
        </p>
      </div>

      {/* Overload alert */}
      <div className="mb-4">
        <OverloadAlert currentLoad={d.overload.currentLoad} avgLoad={d.overload.avgLoad} />
      </div>

      {/* KPI Grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <KPICard
          icon={Activity}
          iconColor="#f97316"
          value={d.kpis.distance.value}
          unit="km"
          label="Distancia"
          trend={d.kpis.distance.trend}
        />
        <KPICard
          icon={Clock}
          iconColor="#8b5cf6"
          value={d.kpis.duration.value}
          unit="h"
          label="Tiempo"
          trend={d.kpis.duration.trend}
        />
        <KPICard
          icon={Zap}
          iconColor="#22c55e"
          value={d.kpis.power.value}
          unit="W"
          label="Potencia media"
          trend={d.kpis.power.trend}
        />
        <KPICard
          icon={Heart}
          iconColor="#ef4444"
          value={d.kpis.hr.value}
          unit="bpm"
          label="FC media"
          trend={d.kpis.hr.trend}
        />
      </div>

      {/* Charts */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <PowerTrendChart data={d.powerTrend} />
        <DailyLoadChart data={d.dailyLoad} />
      </div>

      {/* AI Coach Card */}
      <div className="mb-6">
        <AICoachCard recommendation={d.coachTip.recommendation} tips={d.coachTip.tips} />
      </div>

      {/* Recent Activities */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-[var(--text-primary)]">
            Actividades recientes
          </h2>
          <span className="flex items-center gap-1 text-[13px] font-medium text-[var(--accent)]">
            Ver todas
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {d.recentActivities.map((activity) => (
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
      </div>
    </div>
  );
}
