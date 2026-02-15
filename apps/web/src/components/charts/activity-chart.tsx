"use client";

import { useState, useId } from "react";
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ActivityChartProps {
  data: Array<{
    km: number;
    power: number;
    hr: number;
    cadence: number;
  }>;
}

const CHART_TABS = [
  { key: "power", label: "Potencia", color: "#f97316" },
  { key: "hr", label: "FC", color: "#ef4444" },
  { key: "cadence", label: "Cadencia", color: "#8b5cf6" },
] as const;

type ChartKey = (typeof CHART_TABS)[number]["key"];

export function ActivityChart({ data }: ActivityChartProps) {
  const [activeChart, setActiveChart] = useState<ChartKey>("power");
  const gradientId = useId();

  const activeTab = CHART_TABS.find((t) => t.key === activeChart)!;

  if (data.length === 0) {
    return (
      <div className="rounded-[14px] border border-[var(--card-border)] bg-[var(--card-bg)] p-3 md:p-[18px]">
        <h3 className="mb-3 text-[13px] font-semibold text-[var(--text-primary)]">Gráficas</h3>
        <div className="flex h-[160px] items-center justify-center text-[13px] text-[var(--text-muted)] md:h-[220px]">
          No hay datos de series temporales para esta actividad.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border border-[var(--card-border)] bg-[var(--card-bg)] p-3 md:p-[18px]">
      {/* Header + Tabs */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Gráficas</h3>
        <div className="flex gap-1">
          {CHART_TABS.map((tab) => {
            const isActive = activeChart === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveChart(tab.key)}
                className="rounded-[5px] border px-2.5 py-0.5 text-[11px] transition-colors"
                style={{
                  backgroundColor: isActive ? `${tab.color}15` : "transparent",
                  borderColor: isActive ? `${tab.color}40` : "var(--input-border)",
                  color: isActive ? tab.color : "var(--text-muted)",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[160px] md:h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={activeTab.color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={activeTab.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-color)" vertical={false} />
            <XAxis
              dataKey="km"
              tick={{ fontSize: 10, fill: "var(--text-muted)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v} km`}
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
              dataKey={activeChart}
              stroke={activeTab.color}
              strokeWidth={1.5}
              fill={`url(#${gradientId})`}
              dot={false}
              name={activeTab.label}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
