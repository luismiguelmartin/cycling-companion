import Link from "next/link";
import { Activity, ChevronRight } from "lucide-react";
import { ACTIVITY_TYPES, RPE_DESCRIPTIONS, type ActivityTypeKey } from "shared";
import { RPEIndicator } from "./rpe-indicator";

interface ActivityListItemProps {
  id: string;
  name: string;
  date: string;
  type: string;
  distanceKm: number | null;
  durationFormatted: string;
  avgPower: number | null;
  avgHR: number | null;
  rpe: number | null;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export function ActivityListItem({
  id,
  name,
  date,
  type,
  distanceKm,
  durationFormatted,
  avgPower,
  avgHR,
  rpe,
}: ActivityListItemProps) {
  const activityType = ACTIVITY_TYPES[type as ActivityTypeKey] ?? ACTIVITY_TYPES.endurance;

  return (
    <Link
      href={`/activities/${id}`}
      className="mb-2 flex flex-col rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-3 transition-colors hover:bg-[var(--hover-bg)] md:flex-row md:items-center md:p-3.5"
    >
      {/* Top row: icon + info + desktop metrics */}
      <div className="flex flex-1 items-center gap-3">
        {/* Type icon */}
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg md:h-9 md:w-9"
          style={{ backgroundColor: activityType.bg, color: activityType.color }}
        >
          <Activity className="h-[15px] w-[15px]" />
        </div>

        {/* Name + badge + date */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">{name}</p>
            <span
              className="shrink-0 rounded-[5px] px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: activityType.bg,
                color: activityType.color,
              }}
            >
              {activityType.label}
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">{formatDate(date)}</p>
        </div>
      </div>

      {/* Desktop metrics (hidden on mobile) */}
      <div className="hidden shrink-0 items-center gap-4 text-[12px] md:flex">
        <span className="text-[var(--text-primary)]">
          {distanceKm != null ? `${distanceKm.toFixed(1)} km` : "—"}
        </span>
        <span className="text-[var(--text-secondary)]">{durationFormatted}</span>
        <span className="font-semibold" style={{ color: "#f97316" }}>
          {avgPower != null ? `${avgPower}W` : "—"}
        </span>
        <span style={{ color: "#ef4444" }}>{avgHR != null ? `${avgHR} bpm` : "—"}</span>
        <div className="hidden lg:block">
          <div className="flex flex-col items-end gap-0.5">
            <RPEIndicator value={rpe} />
            <span className="text-[10px] text-[var(--text-secondary)]">
              {rpe != null ? `${rpe} — ${RPE_DESCRIPTIONS[rpe]}` : "—"}
            </span>
          </div>
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
      </div>

      {/* Mobile metrics grid (hidden on desktop) */}
      <div className="mt-2 grid grid-cols-4 gap-1.5 md:hidden">
        <div>
          <p className="text-[10px] text-[var(--text-muted)]">Dist.</p>
          <p className="text-xs font-semibold text-[var(--text-primary)]">
            {distanceKm != null ? `${distanceKm.toFixed(1)}km` : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--text-muted)]">Pot.</p>
          <p className="text-xs font-semibold" style={{ color: "#f97316" }}>
            {avgPower != null ? `${avgPower}W` : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--text-muted)]">FC</p>
          <p className="text-xs font-semibold" style={{ color: "#ef4444" }}>
            {avgHR != null ? `${avgHR}bpm` : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--text-muted)]">Tiempo</p>
          <p className="text-xs font-semibold text-[var(--text-primary)]">{durationFormatted}</p>
        </div>
      </div>
    </Link>
  );
}
