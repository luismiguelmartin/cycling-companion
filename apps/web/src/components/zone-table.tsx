import { POWER_ZONES, HR_ZONES, calculateZones } from "shared";

interface ZoneTableProps {
  type: "power" | "hr";
  referenceValue: number | null;
  label: string;
}

export function ZoneTable({ type, referenceValue, label }: ZoneTableProps) {
  const zones = type === "power" ? POWER_ZONES : HR_ZONES;
  const unit = type === "power" ? "W" : "bpm";

  if (referenceValue == null) {
    return (
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 md:p-5">
        <h3 className="mb-1 text-[16px] font-bold text-[var(--text-primary)]">Zonas de {label}</h3>
        <p className="text-[13px] text-[var(--text-muted)]">
          Introduce tu {type === "power" ? "FTP" : "FC máxima"} en la pestaña Datos para ver las
          zonas de {label.toLowerCase()}.
        </p>
      </div>
    );
  }

  const calculated = calculateZones(zones, referenceValue, unit);
  const maxValue = type === "power" ? referenceValue * 1.3 : referenceValue;

  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 md:p-5">
      <h3 className="mb-1 text-[16px] font-bold text-[var(--text-primary)]">Zonas de {label}</h3>
      <p className="mb-4 text-[12px] text-[var(--text-muted)]">
        Basadas en {type === "power" ? "FTP" : "FC máx"} {referenceValue}
        {unit}
      </p>

      <div className="flex flex-col gap-2.5">
        {calculated.map((zone) => {
          const barWidth =
            zone.max === Infinity ? 100 : Math.min(100, Math.round((zone.max / maxValue) * 100));

          return (
            <div key={zone.zone} className="flex items-center gap-3">
              <span className="w-6 shrink-0 text-[11px] font-medium text-[var(--text-muted)]">
                {zone.zone}
              </span>
              <span className="w-24 shrink-0 text-[13px] font-medium text-[var(--text-primary)]">
                {zone.name}
              </span>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-[var(--input-bg)]">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: zone.color,
                    }}
                  />
                </div>
                <span className="w-20 shrink-0 text-right text-[12px] text-[var(--text-secondary)]">
                  {zone.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
