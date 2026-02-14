import type { ReactNode } from "react";

export interface MetricItem {
  icon: ReactNode;
  label: string;
  value: string;
  unit: string;
}

interface MetricsGridProps {
  metrics: MetricItem[];
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-3 gap-1.5 md:grid-cols-6 md:gap-2.5">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-[10px] border border-[var(--card-border)] bg-[var(--card-bg)] p-2 md:p-3"
        >
          <div className="mb-1 flex items-center gap-1.5">
            {metric.icon}
            <span className="text-[10px] text-[var(--text-muted)]">{metric.label}</span>
          </div>
          <div>
            <span className="text-base font-bold text-[var(--text-primary)] md:text-xl">
              {metric.value}
            </span>
            {metric.unit && (
              <span className="ml-0.5 text-[10px] text-[var(--text-muted)]">{metric.unit}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
