import Link from "next/link";
import { MapPinOff } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--page-bg)] p-4">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-600/20">
          <MapPinOff className="h-10 w-10 text-orange-500" />
        </div>

        <h1 className="mb-2 text-6xl font-bold text-[var(--text-primary)]">404</h1>

        <p className="mb-1 text-lg font-semibold text-[var(--text-primary)]">
          Ruta no encontrada
        </p>
        <p className="mb-8 text-sm text-[var(--text-muted)]">
          Parece que esta ruta no existe. Vuelve al dashboard para seguir pedaleando.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-orange-600 hover:to-orange-700 hover:shadow-lg"
        >
          Volver al dashboard
        </Link>
      </div>
    </div>
  );
}
