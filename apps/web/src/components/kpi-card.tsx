import { TrendingUp, TrendingDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface KPICardProps {
  icon: LucideIcon;
  iconColor: string;
  value: string;
  unit: string;
  label: string;
  trend?: {
    direction: "up" | "down";
    percentage: number;
  };
}

export function KPICard({ icon: Icon, iconColor, value, unit, label, trend }: KPICardProps) {
  const isPositive = trend?.direction === "up";

  return (
    <div className="relative rounded-[14px] border border-[var(--card-border)] bg-[var(--card-bg)] p-3 md:p-[18px]">
      {/* Trend badge */}
      {trend && (
        <div
          className={`absolute right-2 top-2 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
            isPositive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
          }`}
        >
          {isPositive ? (
            <TrendingUp className="h-2.5 w-2.5" />
          ) : (
            <TrendingDown className="h-2.5 w-2.5" />
          )}
          {trend.percentage}%
        </div>
      )}

      {/* Icon */}
      <div
        className="mb-2 flex h-10 w-10 items-center justify-center rounded-[10px]"
        style={{ backgroundColor: `${iconColor}26` }}
      >
        <Icon className="h-5 w-5" style={{ color: iconColor }} />
      </div>

      {/* Value */}
      <p className="text-xl font-bold text-[var(--text-primary)] md:text-[26px] md:leading-tight">
        {value}
        <span className="ml-1 text-[13px] font-normal text-[var(--text-secondary)]">{unit}</span>
      </p>

      {/* Label */}
      <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">{label}</p>
    </div>
  );
}
