"use client";

import { AlertTriangle } from "lucide-react";

interface WeeklyLoadBarProps {
  currentTSS: number;
  avgTSS: number;
  maxTSS: number;
}

export function WeeklyLoadBar({ currentTSS, avgTSS, maxTSS }: WeeklyLoadBarProps) {
  const pct = Math.min((currentTSS / maxTSS) * 100, 100);
  const isAboveAvg = currentTSS > avgTSS;
  const isHighRisk = currentTSS > avgTSS * 1.2;

  const valueColor = isHighRisk ? "#ef4444" : isAboveAvg ? "#eab308" : "#22c55e";

  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[13px] font-medium text-[var(--text-secondary)]">Carga semanal</span>
        <div className="flex items-center gap-1.5">
          {isAboveAvg && <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />}
          <span className="text-[15px] font-bold" style={{ color: valueColor }}>
            {currentTSS} TSS
          </span>
        </div>
      </div>

      {/* Bar */}
      <div className="relative h-[7px] rounded-full bg-[var(--input-bg)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-orange-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Scale */}
      <div className="mt-1.5 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
        <span>0</span>
        <span>Media: {avgTSS}</span>
        <span>{maxTSS}</span>
      </div>
    </div>
  );
}
