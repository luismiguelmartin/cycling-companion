"use client";

import { Clock } from "lucide-react";
import { ACTIVITY_TYPES, type PlanDay, type ActivityTypeKey } from "shared";
import { TipCard } from "@/components/tip-card";

interface DayDetailProps {
  day: PlanDay;
}

export function DayDetail({ day }: DayDetailProps) {
  const typeConfig = ACTIVITY_TYPES[day.type as ActivityTypeKey];

  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 md:p-5">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Left column: detail */}
        <div>
          {/* Header */}
          <div className="mb-3 flex items-center gap-2.5">
            <span className="text-[20px] leading-none">{typeConfig.emoji}</span>
            <div>
              <h3 className="text-[16px] font-bold text-[var(--text-primary)]">{day.title}</h3>
              <span className="text-[12px] text-[var(--text-muted)]">
                {day.day} {day.date}
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="mb-3 text-[13px] leading-[1.6] text-[var(--text-secondary)]">
            {day.description}
          </p>

          {/* Duration */}
          {day.duration !== "—" && (
            <div className="flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)]">
              <Clock className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              <span>{day.duration}</span>
            </div>
          )}
        </div>

        {/* Right column: tips */}
        <div className="flex flex-col gap-2.5">
          <TipCard variant="nutrition" text={day.nutrition} />
          <TipCard variant="rest" text={day.rest} />
        </div>
      </div>
    </div>
  );
}
