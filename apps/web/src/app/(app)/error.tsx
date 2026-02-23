"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AppError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-600/20">
          <AlertTriangle className="h-10 w-10 text-orange-500" />
        </div>

        <p className="mb-1 text-lg font-semibold text-[var(--text-primary)]">
          Error al cargar la página
        </p>
        <p className="mb-8 text-sm text-[var(--text-muted)]">
          No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.
        </p>

        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-orange-600 hover:to-orange-700 hover:shadow-lg"
        >
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </button>
      </div>
    </div>
  );
}
