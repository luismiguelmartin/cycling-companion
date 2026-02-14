"use client";

interface DurationInputProps {
  hours: string;
  minutes: string;
  seconds: string;
  onHoursChange: (value: string) => void;
  onMinutesChange: (value: string) => void;
  onSecondsChange: (value: string) => void;
  required?: boolean;
}

export function DurationInput({
  hours,
  minutes,
  seconds,
  onHoursChange,
  onMinutesChange,
  onSecondsChange,
  required,
}: DurationInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium text-[var(--text-primary)]">
        Duración
        {required && <span className="text-red-500"> *</span>}
      </label>
      <div className="flex gap-2">
        <div className="flex flex-1 items-center gap-1">
          <input
            type="text"
            inputMode="numeric"
            placeholder="1"
            value={hours}
            onChange={(e) => onHoursChange(e.target.value)}
            className="w-full rounded-[9px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-center text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          <span className="text-[12px] text-[var(--text-muted)]">h</span>
        </div>
        <div className="flex flex-1 items-center gap-1">
          <input
            type="text"
            inputMode="numeric"
            placeholder="45"
            value={minutes}
            onChange={(e) => onMinutesChange(e.target.value)}
            className="w-full rounded-[9px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-center text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          <span className="text-[12px] text-[var(--text-muted)]">min</span>
        </div>
        <div className="flex flex-1 items-center gap-1">
          <input
            type="text"
            inputMode="numeric"
            placeholder="00"
            value={seconds}
            onChange={(e) => onSecondsChange(e.target.value)}
            className="w-full rounded-[9px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-center text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          <span className="text-[12px] text-[var(--text-muted)]">seg</span>
        </div>
      </div>
    </div>
  );
}
