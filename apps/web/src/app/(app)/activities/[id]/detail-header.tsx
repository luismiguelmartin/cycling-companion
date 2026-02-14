import { ACTIVITY_TYPES, type ActivityTypeKey } from "shared";

interface DetailHeaderProps {
  name: string;
  type: string;
  dateFormatted: string;
}

export function DetailHeader({ name, type, dateFormatted }: DetailHeaderProps) {
  const activityType = ACTIVITY_TYPES[type as ActivityTypeKey] ?? ACTIVITY_TYPES.endurance;

  return (
    <div>
      <div className="flex items-center gap-2">
        <h1 className="text-[20px] font-bold text-[var(--text-primary)] md:text-[26px]">{name}</h1>
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
      <p className="text-xs text-[var(--text-muted)]">{dateFormatted}</p>
    </div>
  );
}
