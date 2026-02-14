import { AlertTriangle } from "lucide-react";

interface OverloadAlertProps {
  currentLoad: number;
  avgLoad: number;
}

export function OverloadAlert({ currentLoad, avgLoad }: OverloadAlertProps) {
  if (avgLoad === 0) return null;

  const percentage = Math.round(((currentLoad - avgLoad) / avgLoad) * 100);
  if (percentage < 20) return null;

  const isSevere = percentage >= 50;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 ${
        isSevere
          ? "border-red-500/30 bg-red-500/[0.08] dark:border-red-500/30 dark:bg-red-500/10"
          : "border-yellow-500/40 bg-yellow-500/[0.06] dark:border-yellow-500/30 dark:bg-yellow-500/10"
      }`}
      role="alert"
    >
      <AlertTriangle
        className={`h-5 w-5 shrink-0 ${isSevere ? "text-red-500" : "text-yellow-500"}`}
      />
      <p
        className={`text-[13px] ${isSevere ? "text-red-500" : "text-yellow-600 dark:text-yellow-500"}`}
      >
        <span className="font-semibold">Carga semanal elevada:</span> +{percentage}% por encima de
        tu media. Considera reducir la intensidad.
      </p>
    </div>
  );
}
