import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { ACTIVITY_TYPES, type ActivityTypeKey } from "shared";

interface DetailHeaderProps {
  name: string;
  type: string;
  dateFormatted: string;
  actions?: ReactNode;
  source?: string;
  stravaId?: number | null;
}

export function DetailHeader({
  name,
  type,
  dateFormatted,
  actions,
  source,
  stravaId,
}: DetailHeaderProps) {
  const activityType = ACTIVITY_TYPES[type as ActivityTypeKey] ?? ACTIVITY_TYPES.endurance;

  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-[20px] font-bold text-[var(--text-primary)] md:text-[26px]">
            {name}
          </h1>
          <span
            className="shrink-0 rounded-[5px] px-2 py-0.5 text-[11px] font-medium"
            style={{
              backgroundColor: activityType.bg,
              color: activityType.color,
            }}
          >
            {activityType.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-[var(--text-muted)]">{dateFormatted}</p>
          {source === "strava" && stravaId && (
            <a
              href={`https://www.strava.com/activities/${stravaId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-[#FC4C02] hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Ver en Strava
            </a>
          )}
          {source === "upload" && (
            <span className="text-[11px] text-[var(--text-muted)]">Importada desde archivo</span>
          )}
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
