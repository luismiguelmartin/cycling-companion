"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, CalendarPlus } from "lucide-react";
import type { PlanDay } from "shared";
import { WeeklyLoadBar } from "@/components/weekly-load-bar";
import { DayGrid } from "./day-grid";
import { DayDetail } from "./day-detail";

const MOCK_PLAN: PlanDay[] = [
  {
    day: "Lun",
    date: "10",
    type: "intervals",
    title: "Intervalos 4x8'",
    intensity: "alta",
    duration: "1h30",
    description: "4 series 8' Z4, 4' rec",
    nutrition: "80g carbs antes. Gel mitad.",
    rest: "Estiramientos 15min. Foam roller.",
    done: true,
    actual_power: 205,
  },
  {
    day: "Mar",
    date: "11",
    type: "recovery",
    title: "Recuperación activa",
    intensity: "baja",
    duration: "1h",
    description: "Z1-Z2, cadencia >85rpm",
    nutrition: "2L extra. Fruta post.",
    rest: "Mín 8h sueño.",
    done: true,
    actual_power: 132,
  },
  {
    day: "Mié",
    date: "12",
    type: "endurance",
    title: "Resistencia Z2",
    intensity: "media",
    duration: "2h",
    description: "Z2 constante",
    nutrition: "2 bidones. Barrita 1h.",
    rest: "Estiramientos. Cena proteínas.",
    done: true,
    actual_power: 168,
  },
  {
    day: "Jue",
    date: "13",
    type: "rest",
    title: "Descanso",
    intensity: "—",
    duration: "—",
    description: "Descanso total",
    nutrition: "No recortar calorías.",
    rest: "Contraste frío/calor.",
    done: true,
    actual_power: null,
  },
  {
    day: "Vie",
    date: "14",
    type: "tempo",
    title: "Tempo sostenido",
    intensity: "media-alta",
    duration: "1h15",
    description: "30' Z3 tras calentamiento",
    nutrition: "Gel antes del bloque.",
    rest: "Acostarse antes 23h.",
    done: false,
    actual_power: null,
  },
  {
    day: "Sáb",
    date: "15",
    type: "endurance",
    title: "Ruta larga Z2",
    intensity: "media",
    duration: "3h",
    description: "Ritmo constante",
    nutrition: "60g/h carbs. Avena antes.",
    rest: "Siesta post.",
    done: false,
    actual_power: null,
  },
  {
    day: "Dom",
    date: "16",
    type: "recovery",
    title: "Rec./descanso",
    intensity: "baja",
    duration: "0-45min",
    description: "Según sensaciones",
    nutrition: "Comida equilibrada.",
    rest: "Foam roller. Preparar semana.",
    done: false,
    actual_power: null,
  },
];

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
  const planDays = serverPlanDays ?? MOCK_PLAN;
  const hasPlan = planDays.length > 0;
  const todayIndex = getTodayIndex(planDays);
  const [selectedIndex, setSelectedIndex] = useState(todayIndex);

  const selectedDay = planDays[selectedIndex];

  // TSS estimates based on mock data
  const currentTSS = 320;
  const avgTSS = 380;
  const maxTSS = 550;

  if (!hasPlan) {
    return <EmptyState />;
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
          onClick={() => alert("Funcionalidad próximamente")}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Recalcular
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

function EmptyState() {
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
          onClick={() => alert("Funcionalidad próximamente")}
          className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
        >
          Generar mi primer plan
        </button>
      </div>
    </div>
  );
}
