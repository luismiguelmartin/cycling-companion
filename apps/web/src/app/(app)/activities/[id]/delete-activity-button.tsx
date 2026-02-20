"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { apiClientDelete } from "@/lib/api/client";

interface DeleteActivityButtonProps {
  activityId: string;
  activityName: string;
}

export function DeleteActivityButton({ activityId, activityName }: DeleteActivityButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await apiClientDelete(`/activities/${activityId}`);
      router.push("/activities");
      router.refresh();
    } catch {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-red-500/10 hover:text-red-500"
        aria-label="Eliminar actividad"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !isDeleting && setOpen(false)}
          />

          {/* Card */}
          <div className="relative z-10 mx-4 w-full max-w-sm rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-2xl">
            <h2 className="text-[16px] font-bold text-[var(--text-primary)]">Eliminar actividad</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
              ¿Seguro que quieres eliminar «{activityName}»? Esta acción no se puede deshacer.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setOpen(false)}
                disabled={isDeleting}
                className="flex-1 rounded-xl border border-[var(--input-border)] px-4 py-2.5 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:bg-red-700 disabled:opacity-60"
              >
                {isDeleting ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
