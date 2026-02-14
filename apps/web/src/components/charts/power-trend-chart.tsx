"use client";

import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";

interface PowerTrendChartProps {
  data: Array<{
    week: string;
    power: number;
    hr: number;
  }>;
}

export function PowerTrendChart({ data }: PowerTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 md:p-5">
        <h3 className="mb-3 text-[14px] font-semibold text-[var(--text-primary)]">
          Tendencia de potencia
        </h3>
        <div className="flex h-[180px] items-center justify-center text-[13px] text-[var(--text-muted)]">
          Sin datos suficientes
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 md:p-5">
      <h3 className="mb-3 text-[14px] font-semibold text-[var(--text-primary)]">
        Tendencia de potencia
      </h3>
      <div className="h-[180px] md:h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-color)" vertical={false} />
            <XAxis
              dataKey="week"
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
            <Area
              type="monotone"
              dataKey="power"
              stroke="#f97316"
              strokeWidth={2}
              fill="url(#powerGradient)"
              name="Potencia (W)"
            />
            <Line
              type="monotone"
              dataKey="hr"
              stroke="#ef4444"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
              name="FC (bpm)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
