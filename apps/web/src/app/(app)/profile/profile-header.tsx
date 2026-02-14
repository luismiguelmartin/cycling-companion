import { GOALS } from "shared";
import type { GoalType } from "shared";

interface ProfileHeaderProps {
  name: string;
  email: string;
  ftp: number | null;
  goal: GoalType;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProfileHeader({ name, email, ftp, goal }: ProfileHeaderProps) {
  const goalLabel = GOALS.find((g) => g.key === goal)?.label ?? goal;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 md:p-5">
      {/* Avatar */}
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-orange-500 to-orange-600 text-[20px] font-bold text-white">
        {getInitials(name)}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[18px] font-bold text-[var(--text-primary)]">{name}</p>
        <p className="truncate text-[13px] text-[var(--text-muted)]">{email}</p>

        {/* Badges */}
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="rounded-[5px] bg-orange-500/[0.12] px-2 py-0.5 text-[11px] font-medium text-orange-500 dark:bg-orange-500/[0.12]">
            FTP {ftp != null ? `${ftp}W` : "—"}
          </span>
          <span className="rounded-[5px] bg-[var(--active-nav-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-primary)]">
            {goalLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
