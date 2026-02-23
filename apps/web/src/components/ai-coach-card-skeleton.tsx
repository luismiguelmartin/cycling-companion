import { Zap } from "lucide-react";

export function AICoachCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-bg)] p-4 md:p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-orange-500 to-orange-600">
          <Zap className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-[12px] font-bold uppercase tracking-wider text-orange-500">
          Entrenador IA
        </span>
      </div>
      <div className="space-y-2">
        <div className="h-3.5 w-full animate-pulse rounded bg-[var(--surface-alt)]" />
        <div className="h-3.5 w-4/5 animate-pulse rounded bg-[var(--surface-alt)]" />
        <div className="h-3.5 w-3/5 animate-pulse rounded bg-[var(--surface-alt)]" />
      </div>
    </div>
  );
}
