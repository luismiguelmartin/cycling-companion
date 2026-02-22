"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, Loader2, Database } from "lucide-react";
import { apiClientPost } from "@/lib/api/client";
import { generateWeekMockActivities } from "@/lib/activities/generate-mock-activity";

export function DashboardEmptyActions() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCreateMock() {
    setLoading(true);
    try {
      const activities = generateWeekMockActivities();
      for (const activity of activities) {
        await apiClientPost("/activities", activity);
      }
      router.refresh();
    } catch (err) {
      console.error("Error creando datos demo:", err);
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 text-center">
      <p className="mb-4 text-[13px] text-[var(--text-muted)]">
        Aún no tienes actividades registradas. Crea datos de ejemplo para explorar la app o importa
        tu primera sesión.
      </p>
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          onClick={handleCreateMock}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-2.5 text-[13px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--hover-bg)] disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Database className="h-4 w-4" />
          )}
          {loading ? "Creando datos..." : "Crear datos demo"}
        </button>
        <Link
          href="/activities/import"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 text-[13px] font-medium text-white shadow-sm transition-opacity hover:opacity-90"
        >
          <Upload className="h-4 w-4" />
          Importar actividad
        </Link>
      </div>
    </div>
  );
}
