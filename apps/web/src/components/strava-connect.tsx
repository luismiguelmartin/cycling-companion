"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Link2, CheckCircle2, Download, Unlink, Loader2, AlertCircle } from "lucide-react";
import type { StravaConnectionStatus, StravaSyncResult } from "shared";
import { StravaLogo } from "@/components/icons/strava-logo";
import { apiClientFetch, apiClientPost, apiClientDelete } from "@/lib/api/client";

interface StravaConnectProps {
  initialStatus: StravaConnectionStatus;
}

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Acceso denegado. Intenta de nuevo.",
  invalid_state: "Error de autenticación. Intenta de nuevo.",
  insufficient_scope: "Permisos insuficientes. Asegúrate de aceptar todos los permisos.",
  already_connected: "Esta cuenta de Strava ya está vinculada a otro usuario.",
  exchange_failed: "Error al conectar con Strava. Intenta de nuevo.",
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "hace un momento";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

export function StravaConnect({ initialStatus }: StravaConnectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<StravaConnectionStatus>(initialStatus);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [syncResult, setSyncResult] = useState<StravaSyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Handle query params feedback post-OAuth
  useEffect(() => {
    const stravaParam = searchParams.get("strava");
    if (!stravaParam) return;

    if (stravaParam === "connected") {
      setToast({ type: "success", message: "Cuenta de Strava conectada correctamente" });
    } else if (stravaParam === "error") {
      const reason = searchParams.get("reason") ?? "unknown";
      setToast({
        type: "error",
        message: ERROR_MESSAGES[reason] ?? "Error al conectar con Strava. Intenta de nuevo.",
      });
    }

    // Clean query params from URL
    router.replace("/profile");
  }, [searchParams, router]);

  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Auto-hide syncResult after 10 seconds
  useEffect(() => {
    if (!syncResult) return;
    const timer = setTimeout(() => setSyncResult(null), 10000);
    return () => clearTimeout(timer);
  }, [syncResult]);

  const handleConnect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const res = await apiClientFetch<{ data: { url: string } }>("/strava/auth-url");
      window.location.href = res.data.url;
    } catch {
      setError("Error al iniciar conexión con Strava");
      setIsConnecting(false);
    }
  }, []);

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    setSyncResult(null);
    setError(null);
    try {
      const res = await apiClientPost<{ data: StravaSyncResult }>("/strava/sync", { count: 30 });
      setSyncResult(res.data);

      // Refresh status
      const statusRes = await apiClientFetch<{ data: StravaConnectionStatus }>("/strava/status");
      setStatus(statusRes.data);
    } catch {
      setError("Error al importar actividades");
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    if (!window.confirm("¿Desconectar Strava? Las actividades ya importadas permanecerán.")) {
      return;
    }

    setIsDisconnecting(true);
    setError(null);
    try {
      await apiClientDelete("/strava/disconnect");
      setStatus({
        connected: false,
        athlete_name: null,
        strava_athlete_id: null,
        connected_at: null,
        last_sync_at: null,
        activities_count: 0,
      });
    } catch {
      setError("Error al desconectar Strava");
    } finally {
      setIsDisconnecting(false);
    }
  }, []);

  return (
    <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 md:p-5">
      {/* Header */}
      <div className="mb-1 flex items-center gap-2">
        <Link2 className="h-4 w-4 text-[var(--text-muted)]" />
        <h2 className="text-[16px] font-bold text-[var(--text-primary)]">Sincronización</h2>
      </div>

      {/* Toast feedback */}
      {toast && (
        <div
          role="alert"
          className={`mb-4 rounded-xl border p-3 text-[13px] ${
            toast.type === "success"
              ? "border-green-500/30 bg-green-500/[0.08] text-green-500"
              : "border-red-500/30 bg-red-500/[0.08] text-red-500"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/[0.08] p-3 text-[13px] text-red-500">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Sync result */}
      {syncResult && !isSyncing && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/[0.08] p-3 text-[13px] text-green-500">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            {syncResult.imported} actividades importadas, {syncResult.skipped} ya existentes
            {syncResult.errors > 0 && `, ${syncResult.errors} errores`}
          </span>
        </div>
      )}

      {!status.connected ? (
        /* Disconnected state */
        <div>
          <p className="mb-4 text-[12px] text-[var(--text-muted)]">
            Conecta tu cuenta de Strava para sincronizar actividades automáticamente
          </p>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FC4C02] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#E34402] disabled:opacity-50 md:w-auto"
            aria-label="Conectar con Strava"
          >
            {isConnecting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <StravaLogo size={16} className="text-white" />
            )}
            Conectar con Strava
          </button>
          <p className="mt-3 text-[11px] text-[var(--text-muted)]">
            También puedes importar archivos .fit/.gpx desde Actividades &rarr; Importar
          </p>
        </div>
      ) : isSyncing ? (
        /* Syncing state */
        <div className="flex items-center gap-3 py-2" role="status" aria-busy="true">
          <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
          <span className="text-[13px] text-[var(--text-primary)]">
            Importando actividades de Strava...
          </span>
        </div>
      ) : (
        /* Connected state */
        <div>
          <p className="mb-4 text-[12px] text-[var(--text-muted)]">
            Tu cuenta de Strava está conectada
          </p>
          <div className="rounded-xl border border-[var(--card-border)] p-4">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-[13px] font-medium text-[var(--text-primary)]">Conectado</span>
            </div>
            <div className="mb-4 space-y-1 text-[12px] text-[var(--text-muted)]">
              <p>
                Última sync:{" "}
                {status.last_sync_at
                  ? formatRelativeTime(status.last_sync_at)
                  : "Nunca sincronizado"}
              </p>
              <p>
                Actividades importadas:{" "}
                {status.activities_count > 0
                  ? status.activities_count
                  : "Sin actividades importadas"}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={handleSync}
                disabled={isSyncing || isDisconnecting}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--card-border)] px-4 py-2 text-[13px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--hover-bg)] disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                Importar historial
              </button>
              <button
                onClick={handleDisconnect}
                disabled={isSyncing || isDisconnecting}
                className="flex items-center justify-center gap-1.5 text-[13px] text-[var(--text-muted)] transition-colors hover:text-red-500 disabled:opacity-50"
              >
                {isDisconnecting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Unlink className="h-3.5 w-3.5" />
                )}
                Desconectar
              </button>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-[var(--text-muted)]">
            Las nuevas actividades se importan automáticamente cuando las subas a Strava
          </p>
          <p className="mt-2 text-center text-[11px] text-[var(--text-muted)]">Powered by Strava</p>
        </div>
      )}
    </section>
  );
}
