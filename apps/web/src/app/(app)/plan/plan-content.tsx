"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, CalendarPlus, Loader2 } from "lucide-react";
import type { PlanDay } from "shared";
import { apiClientPost } from "@/lib/api/client";
import { WeeklyLoadBar } from "@/components/weekly-load-bar";
import { DayGrid } from "./day-grid";
import { DayDetail } from "./day-detail";

interface PlanContentProps {
  serverPlanDays: PlanDay[] | null;
}

function getTodayIndex(days: PlanDay[]): number {
  const today = new Date();
  const dayOfWeek = today.getDay();
  // getDay: 0=Sunday → index 6, Monday=1 → index 0, etc.
  const index = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  return index < days.length ? index : 0;
}

export function PlanContent({ serverPlanDays }: PlanContentProps) {
  const [planDays, setPlanDays] = useState<PlanDay[] | null>(serverPlanDays);
  const [isGenerating, setIsGenerating] = useState(false);
  const hasPlan = planDays && planDays.length > 0;
  const todayIndex = hasPlan ? getTodayIndex(planDays) : 0;
  const [selectedIndex, setSelectedIndex] = useState(todayIndex);

  const selectedDay = hasPlan ? planDays[selectedIndex] : null;

  // TSS estimates — placeholder, ideally from API insights
  const currentTSS = 320;
  const avgTSS = 380;
  const maxTSS = 550;

  async function handleGeneratePlan(forceRegenerate = false) {
    setIsGenerating(true);
    try {
      const res = await apiClientPost<{ data: { plan_data: PlanDay[] } }>("/ai/weekly-plan", {
        force_regenerate: forceRegenerate,
      });
      if (res.data?.plan_data) {
        setPlanDays(res.data.plan_data);
        setSelectedIndex(getTodayIndex(res.data.plan_data));
      }
    } catch {
      // Error generating plan
    } finally {
      setIsGenerating(false);
    }
  }

  if (!hasPlan) {
    return <EmptyState onGenerate={() => handleGeneratePlan(false)} isGenerating={isGenerating} />;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[var(--text-primary)] md:text-[26px]">
            Plan semanal
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <button
              disabled
              className="rounded-md p-0.5 text-[var(--text-muted)] opacity-50"
              aria-label="Semana anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[13px] text-[var(--text-secondary)]">10 — 16 feb 2026</span>
            <button
              disabled
              className="rounded-md p-0.5 text-[var(--text-muted)] opacity-50"
              aria-label="Semana siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <button
          onClick={() => handleGeneratePlan(true)}
          disabled={isGenerating}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isGenerating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {isGenerating ? "Generando..." : "Recalcular"}
        </button>
      </div>

      {/* Weekly Load Bar */}
      <div className="mb-5">
        <WeeklyLoadBar currentTSS={currentTSS} avgTSS={avgTSS} maxTSS={maxTSS} />
      </div>

      {/* Day Grid */}
      <div className="mb-5">
        <DayGrid
          days={planDays}
          selectedIndex={selectedIndex}
          todayIndex={todayIndex}
          onSelect={setSelectedIndex}
        />
      </div>

      {/* Day Detail */}
      {selectedDay && <DayDetail day={selectedDay} />}
    </div>
  );
}

function EmptyState({
  onGenerate,
  isGenerating,
}: {
  onGenerate: () => void;
  isGenerating: boolean;
}) {
  return (
    <div>
      <h1 className="mb-6 text-[22px] font-bold text-[var(--text-primary)] md:text-[26px]">
        Plan semanal
      </h1>
      <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-10 text-center">
        <CalendarPlus className="mb-3 h-10 w-10 text-[var(--text-muted)]" />
        <p className="mb-4 text-[14px] text-[var(--text-secondary)]">
          No hay plan generado para esta semana.
        </p>
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
          {isGenerating ? "Generando plan..." : "Generar mi primer plan"}
        </button>
      </div>
    </div>
  );
}
