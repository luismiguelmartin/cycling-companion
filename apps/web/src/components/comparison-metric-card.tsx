interface ComparisonMetricCardProps {
  metric: string;
  valueA: number;
  valueB: number;
  unit: string;
  color: string;
  inverse?: boolean;
}

export function ComparisonMetricCard({
  metric,
  valueA,
  valueB,
  unit,
  color,
  inverse,
}: ComparisonMetricCardProps) {
  // Calculate delta percentage
  let deltaLabel: string;
  let deltaPositive: boolean;

  if (valueA === 0) {
    deltaLabel = "—";
    deltaPositive = true;
  } else {
    const delta = ((valueB - valueA) / valueA) * 100;
    const rounded = Math.abs(Math.round(delta * 10) / 10);
    deltaLabel = `${delta >= 0 ? "+" : "-"}${rounded}%`;
    // For inverse metrics (like HR), decrease is positive
    deltaPositive = inverse ? delta <= 0 : delta >= 0;
  }

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-3 md:p-4">
      {/* Label */}
      <p className="mb-1.5 text-[11px] text-[var(--text-muted)]">{metric}</p>

      {/* Values row */}
      <div className="flex items-baseline gap-1.5">
        {/* Value A */}
        <span className="text-[13px] font-medium" style={{ color }}>
          {valueA}
        </span>

        {/* Arrow separator */}
        <span className="text-[11px] text-[var(--text-muted)]">&rarr;</span>

        {/* Value B */}
        <span className="text-lg font-bold text-[var(--text-primary)] md:text-[22px]">
          {valueB}
        </span>

        {/* Unit */}
        {unit && <span className="ml-1 text-[11px] text-[var(--text-muted)]">{unit}</span>}
      </div>

      {/* Delta badge */}
      <div className="mt-2">
        <span
          className={`inline-block rounded-[5px] px-1.5 py-0.5 text-xs font-semibold ${
            deltaLabel === "—"
              ? "bg-[var(--hover-bg)] text-[var(--text-muted)]"
              : deltaPositive
                ? "bg-green-500/10 text-green-500"
                : "bg-red-500/10 text-red-500"
          }`}
        >
          {deltaLabel}
        </span>
      </div>
    </div>
  );
}
