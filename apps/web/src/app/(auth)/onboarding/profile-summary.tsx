import { GOALS } from "shared";

interface ProfileSummaryProps {
  data: {
    name: string;
    age: string;
    weight: string;
    ftp: string;
    maxHR: string;
    restHR: string;
    goal: string;
  };
}

export function ProfileSummary({ data }: ProfileSummaryProps) {
  const goalLabel = GOALS.find((g) => g.key === data.goal)?.label ?? data.goal;

  const fields = [
    { label: "Nombre", value: data.name || "---" },
    { label: "Edad", value: data.age ? `${data.age} años` : "---" },
    { label: "Peso", value: data.weight ? `${data.weight} kg` : "---" },
    { label: "FTP", value: data.ftp ? `${data.ftp} W` : "Se estimará" },
    { label: "FC máx", value: data.maxHR ? `${data.maxHR} bpm` : "Se estimará" },
    { label: "Objetivo", value: goalLabel },
  ];

  return (
    <div className="rounded-2xl border border-[var(--input-border)] bg-[var(--input-bg)] p-4">
      <div className="grid grid-cols-2 gap-3">
        {fields.map((field) => (
          <div key={field.label} className="rounded-lg bg-[var(--text-muted)]/[0.08] px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
              {field.label}
            </p>
            <p className="mt-0.5 text-[14px] font-semibold text-[var(--text-primary)]">
              {field.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
