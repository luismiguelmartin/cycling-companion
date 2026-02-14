"use client";

import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";

interface PerformanceRadarChartProps {
  data: Array<{ metric: string; A: number; B: number }>;
}

export function PerformanceRadarChart({ data }: PerformanceRadarChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 md:p-5">
        <h3 className="mb-3 text-[13px] font-semibold text-[var(--text-primary)]">
          Perfil de rendimiento
        </h3>
        <div className="flex h-[220px] items-center justify-center text-[13px] text-[var(--text-muted)] md:h-[260px]">
          Sin datos suficientes
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 md:p-5">
      <h3 className="mb-3 text-[13px] font-semibold text-[var(--text-primary)]">
        Perfil de rendimiento
      </h3>
      <div className="h-[220px] md:h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="var(--grid-color)" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
            />
            <Radar
              name="Anterior"
              dataKey="A"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.12}
              strokeWidth={2}
            />
            <Radar
              name="Actual"
              dataKey="B"
              stroke="#f97316"
              fill="#f97316"
              fillOpacity={0.12}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Custom legend */}
      <div className="mt-2 flex items-center justify-center gap-5">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-sm bg-blue-500" />
          <span className="text-[11px] text-[var(--text-secondary)]">Anterior</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-sm bg-orange-500" />
          <span className="text-[11px] text-[var(--text-secondary)]">Actual</span>
        </div>
      </div>
    </div>
  );
}
