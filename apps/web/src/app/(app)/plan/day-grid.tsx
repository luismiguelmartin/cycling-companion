"use client";

import { ACTIVITY_TYPES, INTENSITY_LEVELS, type PlanDay, type ActivityTypeKey } from "shared";

interface DayGridProps {
  days: PlanDay[];
  selectedIndex: number;
  todayIndex: number;
  onSelect: (index: number) => void;
}

export function DayGrid({ days, selectedIndex, todayIndex, onSelect }: DayGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-7 md:gap-2.5">
      {days.map((day, i) => {
        const isSelected = i === selectedIndex;
        const isToday = i === todayIndex;
        const typeConfig = ACTIVITY_TYPES[day.type as ActivityTypeKey];
        const intensityConfig = INTENSITY_LEVELS[day.intensity];

        return (
          <button
            key={day.day}
            onClick={() => onSelect(i)}
            className="relative flex min-h-[90px] flex-col rounded-xl border p-2.5 text-left transition-all md:min-h-[120px] md:p-3"
            style={{
              backgroundColor: isSelected ? `${typeConfig.color}1a` : "var(--card-bg)",
              borderColor: isSelected ? `${typeConfig.color}66` : "var(--card-border)",
              opacity: day.done ? 0.7 : 1,
            }}
          >
            {/* Today badge */}
            {isToday && (
              <span className="absolute -top-2 right-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-2 py-0.5 text-[9px] font-bold text-white">
                HOY
              </span>
            )}

            {/* Day + date */}
            <div className="mb-1 flex items-center gap-1.5">
              <span className="text-[12px] font-semibold text-[var(--text-primary)]">
                {day.day}
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">{day.date}</span>
            </div>

            {/* Emoji + title */}
            <div className="mb-auto flex items-start gap-1.5">
              <span className="text-[14px] leading-none">{typeConfig.emoji}</span>
              <span className="text-[11px] font-medium leading-tight text-[var(--text-primary)] md:text-[12px]">
                {day.title}
              </span>
            </div>

            {/* Badges */}
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {day.intensity !== "—" && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[9px] font-medium"
                  style={{
                    backgroundColor: `${intensityConfig.color}1a`,
                    color: intensityConfig.color,
                  }}
                >
                  {intensityConfig.label}
                </span>
              )}
              {day.duration !== "—" && (
                <span className="rounded-full bg-[var(--hover-bg)] px-1.5 py-0.5 text-[9px] text-[var(--text-muted)]">
                  {day.duration}
                </span>
              )}
            </div>

            {/* Completed indicator */}
            {day.done && (
              <div className="mt-1.5 text-[10px] font-medium text-green-500">
                {day.type === "rest"
                  ? "✓ Cumplido"
                  : `✓ ${day.actual_power != null ? `${day.actual_power}W` : "Cumplido"}`}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
