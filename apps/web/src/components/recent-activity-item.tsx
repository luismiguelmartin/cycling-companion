import Link from "next/link";
import { ACTIVITY_TYPES, type ActivityTypeKey } from "shared";

interface RecentActivityItemProps {
  id: string;
  name: string;
  date: string;
  type: string;
  distanceKm?: number | null;
  durationSeconds: number;
  avgPower?: number | null;
  avgHR?: number | null;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export function RecentActivityItem({
  id,
  name,
  date,
  type,
  distanceKm,
  durationSeconds,
  avgPower,
  avgHR,
}: RecentActivityItemProps) {
  const activityType = ACTIVITY_TYPES[type as ActivityTypeKey] ?? ACTIVITY_TYPES.outdoor;

  return (
    <Link
      href={`/activities/${id}`}
      className="flex items-center gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-3 transition-colors hover:bg-[var(--hover-bg)] md:p-4"
    >
      {/* Type badge */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm"
        style={{ backgroundColor: activityType.bg, color: activityType.color }}
      >
        {activityType.emoji}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-[var(--text-primary)]">{name}</p>
        <p className="text-[11px] text-[var(--text-muted)]">{formatDate(date)}</p>
      </div>

      {/* Metrics */}
      <div className="flex shrink-0 items-center gap-3 text-[12px] text-[var(--text-secondary)]">
        {distanceKm != null && distanceKm > 0 && <span>{distanceKm.toFixed(1)} km</span>}
        <span>{formatDuration(durationSeconds)}</span>
        {avgPower != null && avgPower > 0 && <span>{avgPower}W</span>}
        {avgHR != null && avgHR > 0 && <span>{avgHR} bpm</span>}
      </div>
    </Link>
  );
}
