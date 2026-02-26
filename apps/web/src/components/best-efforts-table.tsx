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
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">Mejores esfuerzos</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
        {data.map((effort) => (
          <div
            key={effort.windowSeconds}
            className="flex flex-col items-center rounded-md border bg-muted/50 p-3"
          >
            <span className="text-xs text-muted-foreground">{effort.label}</span>
            <div className="mt-1 flex items-center gap-1">
              <Zap className="h-3 w-3" style={{ color: "#f97316" }} />
              <span className="text-lg font-semibold">{effort.power}</span>
              <span className="text-xs text-muted-foreground">W</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
