import { Zap } from "lucide-react";

interface AICoachWelcomeProps {
  userName?: string;
}

export function AICoachWelcome({ userName }: AICoachWelcomeProps) {
  return (
    <div className="rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-bg)] p-5">
      {/* Badge */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-orange-500 to-orange-600">
          <Zap className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-[12px] font-bold uppercase tracking-wider text-orange-500">
          Tu entrenador IA
        </span>
      </div>

      {/* Message */}
      <p className="text-[13px] leading-[1.6] text-[var(--text-secondary)]">
        {userName ? (
          <>
            <strong className="text-[var(--text-primary)]">¡Hola, {userName}!</strong> Estoy listo
            para ayudarte. Sube tu primera actividad o déjame generarte un plan semanal basado en tu
            perfil. Cuantos más datos tenga, mejores serán mis recomendaciones. 🚴‍♂️
          </>
        ) : (
          <>
            <strong className="text-[var(--text-primary)]">¡Hola!</strong> Estoy listo para ayudarte
            a mejorar tu rendimiento. 🚴‍♂️
          </>
        )}
      </p>
    </div>
  );
}
