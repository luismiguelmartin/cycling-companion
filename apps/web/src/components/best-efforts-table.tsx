import { Zap } from "lucide-react";

interface BestEffort {
  windowSeconds: number;
  label: string;
  power: number;
}

interface BestEffortsTableProps {
  data: BestEffort[];
}

export function BestEffortsTable({ data }: BestEffortsTableProps) {
  if (data.length === 0) return null;

  return (
    <div>
      <h3 className="mb-2 text-[13px] font-semibold text-[var(--text-primary)]">
        Mejores esfuerzos
      </h3>
      <div className="grid grid-cols-3 gap-1.5 md:grid-cols-5 md:gap-2.5">
        {data.map((effort) => (
          <div
            key={effort.windowSeconds}
            className="rounded-[10px] border border-[var(--card-border)] bg-[var(--card-bg)] p-2 md:p-3"
          >
            <div className="mb-1 flex items-center gap-1.5">
              <Zap className="h-3 w-3" style={{ color: "#f97316" }} />
              <span className="text-[10px] text-[var(--text-muted)]">{effort.label}</span>
            </div>
            <div>
              <span className="text-base font-bold text-[var(--text-primary)] md:text-xl">
                {effort.power}
              </span>
              <span className="ml-0.5 text-[10px] text-[var(--text-muted)]">W</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
