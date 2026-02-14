"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DailyLoadChartProps {
  data: Array<{
    day: string;
    load: number;
  }>;
}

export function DailyLoadChart({ data }: DailyLoadChartProps) {
  const hasData = data.some((d) => d.load > 0);

  if (!hasData) {
    return (
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 md:p-5">
        <h3 className="mb-3 text-[14px] font-semibold text-[var(--text-primary)]">Carga diaria</h3>
        <div className="flex h-[160px] items-center justify-center text-[13px] text-[var(--text-muted)]">
          Sin actividades esta semana
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 md:p-5">
      <h3 className="mb-3 text-[14px] font-semibold text-[var(--text-primary)]">Carga diaria</h3>
      <div className="h-[160px] md:h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-color)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "var(--text-muted)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--text-muted)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--tooltip-bg)",
                border: "1px solid var(--tooltip-border)",
                borderRadius: 8,
                fontSize: 11,
              }}
            />
            <Bar dataKey="load" fill="#f97316" radius={[5, 5, 0, 0]} name="TSS" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
