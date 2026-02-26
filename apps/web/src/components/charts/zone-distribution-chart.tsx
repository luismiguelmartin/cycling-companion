"use client";

import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ZoneData {
  zone: string;
  name: string;
  seconds: number;
  percentage: number;
  color: string;
}

interface ZoneDistributionChartProps {
  data: ZoneData[];
  title: string;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ZoneData; value: number }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const zone = payload[0].payload;
  return (
    <div
      className="rounded-md border text-xs"
      style={{
        backgroundColor: "hsl(var(--card))",
        borderColor: "hsl(var(--border))",
        padding: "6px 10px",
      }}
    >
      <span className="font-medium">
        {zone.zone} {zone.name}
      </span>
      <br />
      {zone.percentage.toFixed(1)}% ({formatTime(zone.seconds)})
    </div>
  );
}

export function ZoneDistributionChart({ data, title }: ZoneDistributionChartProps) {
  if (data.length === 0) return null;

  const chartData = data.map((d) => ({
    ...d,
    label: `${d.zone} ${d.name}`,
  }));

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">{title}</h3>
      <ResponsiveContainer width="100%" height={data.length * 36 + 20}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 40 }}>
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} fontSize={11} />
          <YAxis
            type="category"
            dataKey="label"
            width={75}
            fontSize={11}
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
