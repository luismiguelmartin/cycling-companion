"use client";

interface OnboardingFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  hint?: string;
  type?: string;
  error?: string;
}

export function OnboardingField({
  label,
  placeholder,
  value,
  onChange,
  unit,
  hint,
  type = "text",
  error,
}: OnboardingFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-[var(--text-primary)]">{label}</label>
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-[10px] border bg-[var(--input-bg)] px-3.5 py-3 text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-[var(--input-border)] focus:border-orange-500 focus:ring-orange-500"
          }`}
        />
        {unit && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] text-[var(--text-muted)]">
            {unit}
          </span>
        )}
      </div>
      {hint && <p className="text-[11px] leading-[1.5] text-[var(--text-muted)]">{hint}</p>}
      {error && <p className="text-[11px] leading-[1.5] text-red-500">{error}</p>}
    </div>
  );
}
