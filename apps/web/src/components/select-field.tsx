"use client";

import { ChevronDown } from "lucide-react";

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
}

export function SelectField({ label, value, onChange, options, required }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium text-[var(--text-primary)]">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full cursor-pointer appearance-none rounded-[9px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3.5 py-2.5 text-[14px] text-[var(--text-primary)] focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
        />
      </div>
    </div>
  );
}
