"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Check,
  FileText,
  AlertCircle,
  Calendar,
  Activity,
  Clock,
  Zap,
  Heart,
  TrendingUp,
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { activityCreateSchema } from "shared";
import { ImportModeToggle } from "./import-mode-toggle";
import { FileDropZone, type FileInfo } from "@/components/file-drop-zone";
import { SelectField } from "@/components/select-field";
import { DurationInput } from "@/components/duration-input";
import { RPEInput } from "@/components/rpe-input";
import { type ImportFormData, generateMockActivity } from "@/lib/activities/generate-mock-activity";
import { durationToSeconds } from "@/lib/activities/duration-utils";

export function ImportActivityContent() {
  const router = useRouter();
  const [mode, setMode] = useState<"file" | "manual">("file");
  const [file, setFile] = useState<FileInfo | null>(null);
  const [form, setForm] = useState<ImportFormData>({
    name: "",
    date: "",
    type: "outdoor",
    duration_h: "",
    duration_m: "",
    duration_s: "",
    distance: "",
    avgPower: "",
    avgHR: "",
    maxHR: "",
    avgCadence: "",
    rpe: 0,
    notes: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const upd = (key: keyof ImportFormData, value: string | number) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const canSave =
    mode === "file" ? !!file : !!(form.name && form.date && (form.duration_h || form.duration_m));

  const handleGenerateMock = () => {
    setForm(generateMockActivity());
  };

  const handleSave = async () => {
    if (!canSave || isSaving) return;
    setIsSaving(true);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );

      const payload = {
        name: form.name,
        date: form.date,
        type: form.type,
        duration_seconds: durationToSeconds(form.duration_h, form.duration_m, form.duration_s),
        distance_km: form.distance ? parseFloat(form.distance) : null,
        avg_power_watts: form.avgPower ? parseInt(form.avgPower) : null,
        avg_hr_bpm: form.avgHR ? parseInt(form.avgHR) : null,
        max_hr_bpm: form.maxHR ? parseInt(form.maxHR) : null,
        avg_cadence_rpm: form.avgCadence ? parseInt(form.avgCadence) : null,
        rpe: form.rpe > 0 ? form.rpe : null,
        notes: form.notes || null,
      };

      const result = activityCreateSchema.safeParse(payload);
      if (!result.success) {
        setIsSaving(false);
        return;
      }

      const { error } = await supabase.from("activities").insert(result.data);

      if (error) {
        setIsSaving(false);
        return;
      }

      setSaved(true);
      setTimeout(() => {
        router.push("/activities");
      }, 1500);
    } catch {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/activities");
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-[var(--text-primary)] md:text-[26px]">
          Importar actividad
        </h1>
        <p className="mt-1.5 text-[12px] text-[var(--text-muted)] md:text-[14px]">
          Sube un archivo de tu dispositivo o introduce los datos manualmente
        </p>
      </div>

      {/* Mode toggle */}
      <ImportModeToggle mode={mode} onModeChange={setMode} />

      {/* ─── FILE MODE ─── */}
      {mode === "file" && (
        <div className="max-w-[640px]">
          <FileDropZone file={file} onFile={setFile} onClear={() => setFile(null)} />

          {/* File preview / parsed data hint */}
          {file && (
            <div
              className="mt-4 rounded-[14px] p-5"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--card-border)",
              }}
            >
              <h3 className="mb-3.5 text-[14px] font-semibold text-[var(--text-primary)]">
                Datos a extraer del archivo
              </h3>
              <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
                {[
                  { l: "Fecha y hora", v: "Automatico", i: Calendar },
                  { l: "Distancia", v: "Automatico", i: Activity },
                  { l: "Duracion", v: "Automatico", i: Clock },
                  { l: "Potencia media", v: "Si disponible", i: Zap },
                  { l: "FC media", v: "Si disponible", i: Heart },
                  { l: "Cadencia", v: "Si disponible", i: TrendingUp },
                ].map((d) => (
                  <div
                    key={d.l}
                    className="rounded-lg p-2.5"
                    style={{ background: "rgba(148,163,184,0.06)" }}
                  >
                    <div className="mb-0.5 flex items-center gap-1.5">
                      <d.i size={12} style={{ color: "var(--text-muted)" }} />
                      <span className="text-[11px] text-[var(--text-muted)]">{d.l}</span>
                    </div>
                    <span className="text-[13px] font-medium text-[var(--text-secondary)]">
                      {d.v}
                    </span>
                  </div>
                ))}
              </div>

              {/* Optional overrides */}
              <div
                className="mt-4 flex flex-col gap-3 pt-3.5"
                style={{ borderTop: "1px solid var(--input-border)" }}
              >
                <h4 className="text-[13px] font-semibold text-[var(--text-primary)]">
                  Datos adicionales (opcionales)
                </h4>
                <div className="flex flex-col gap-3">
                  {/* Inline Field for nombre */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-[var(--text-primary)]">
                      Nombre de la actividad
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Intervalos Sierra Norte"
                      value={form.name}
                      onChange={(e) => upd("name", e.target.value)}
                      className="w-full rounded-[9px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3.5 py-2.5 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <SelectField
                    label="Tipo"
                    value={form.type}
                    onChange={(v) => upd("type", v)}
                    options={[
                      { value: "outdoor", label: "Exterior" },
                      { value: "indoor", label: "Rodillo" },
                      { value: "recovery", label: "Recuperacion" },
                    ]}
                  />
                  <RPEInput value={form.rpe} onChange={(v) => upd("rpe", v)} />
                  {/* Inline Field for notas */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-[var(--text-primary)]">
                      Notas
                    </label>
                    <input
                      type="text"
                      placeholder="Sensaciones, clima, observaciones..."
                      value={form.notes}
                      onChange={(e) => upd("notes", e.target.value)}
                      className="w-full rounded-[9px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3.5 py-2.5 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── MANUAL MODE ─── */}
      {mode === "manual" && (
        <div className="max-w-[640px]">
          <div
            className="rounded-[14px] p-4 md:p-6"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
            }}
          >
            {/* Info banner */}
            <div
              className="mb-5 flex items-center gap-2.5 rounded-[10px] px-3.5 py-2.5"
              style={{
                background: "rgba(59,130,246,0.06)",
                border: "1px solid rgba(59,130,246,0.15)",
              }}
            >
              <AlertCircle size={16} color="#3b82f6" className="shrink-0" />
              <span className="text-[12px] leading-[1.5] text-[var(--text-secondary)]">
                Introduce los datos principales de tu sesion. La IA generara el analisis con los
                datos disponibles.
              </span>
            </div>

            {/* Required section */}
            <h3
              className="mb-3.5 text-[13px] font-bold uppercase tracking-wide"
              style={{ color: "var(--accent)" }}
            >
              Datos obligatorios
            </h3>

            <div className="mb-6 flex flex-col gap-3.5">
              {/* Nombre */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[var(--text-primary)]">
                  Nombre de la actividad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Ruta larga Navacerrada"
                  value={form.name}
                  onChange={(e) => upd("name", e.target.value)}
                  className="w-full rounded-[9px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3.5 py-2.5 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Fecha + Tipo */}
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-[var(--text-primary)]">
                    Fecha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => upd("date", e.target.value)}
                    className="w-full rounded-[9px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3.5 py-2.5 text-[14px] text-[var(--text-primary)] focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div className="flex-1">
                  <SelectField
                    label="Tipo de salida"
                    value={form.type}
                    onChange={(v) => upd("type", v)}
                    required
                    options={[
                      { value: "outdoor", label: "Exterior" },
                      { value: "indoor", label: "Rodillo" },
                      { value: "recovery", label: "Recuperacion" },
                    ]}
                  />
                </div>
              </div>

              {/* Duracion */}
              <DurationInput
                hours={form.duration_h}
                minutes={form.duration_m}
                seconds={form.duration_s}
                onHoursChange={(v) => upd("duration_h", v)}
                onMinutesChange={(v) => upd("duration_m", v)}
                onSecondsChange={(v) => upd("duration_s", v)}
                required
              />
            </div>

            {/* Metrics section */}
            <h3 className="mb-3.5 text-[13px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">
              Metricas (opcionales)
            </h3>

            <div className="mb-6 flex flex-col gap-3.5">
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-[var(--text-primary)]">
                    Distancia
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="52.3"
                      value={form.distance}
                      onChange={(e) => upd("distance", e.target.value)}
                      className="w-full rounded-[9px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3.5 py-2.5 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    <span className="text-[12px] text-[var(--text-muted)]">km</span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-[var(--text-primary)]">
                    Potencia media
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="205"
                      value={form.avgPower}
                      onChange={(e) => upd("avgPower", e.target.value)}
                      className="w-full rounded-[9px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3.5 py-2.5 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    <span className="text-[12px] text-[var(--text-muted)]">W</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-[var(--text-primary)]">
                    FC media
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="156"
                      value={form.avgHR}
                      onChange={(e) => upd("avgHR", e.target.value)}
                      className="w-full rounded-[9px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3.5 py-2.5 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    <span className="text-[12px] text-[var(--text-muted)]">bpm</span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-[var(--text-primary)]">
                    FC maxima
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="172"
                      value={form.maxHR}
                      onChange={(e) => upd("maxHR", e.target.value)}
                      className="w-full rounded-[9px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3.5 py-2.5 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    <span className="text-[12px] text-[var(--text-muted)]">bpm</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-[var(--text-primary)]">
                    Cadencia media
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="88"
                      value={form.avgCadence}
                      onChange={(e) => upd("avgCadence", e.target.value)}
                      className="w-full rounded-[9px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3.5 py-2.5 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    <span className="text-[12px] text-[var(--text-muted)]">rpm</span>
                  </div>
                </div>
                <div className="flex-1" />
              </div>
            </div>

            {/* RPE */}
            <div className="mb-5">
              <RPEInput value={form.rpe} onChange={(v) => upd("rpe", v)} />
            </div>

            {/* Notes textarea */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[var(--text-primary)]">Notas</label>
              <textarea
                placeholder="Sensaciones, clima, observaciones..."
                value={form.notes}
                onChange={(e) => upd("notes", e.target.value)}
                rows={3}
                className="w-full resize-y rounded-[9px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3.5 py-2.5 font-[family-name:var(--font-dm-sans)] text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── ACTION BAR ─── */}
      <div className="flex max-w-[640px] flex-wrap items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={handleCancel}
          className="flex items-center gap-1.5 rounded-[10px] border border-[var(--input-border)] bg-transparent px-[18px] py-2.5 text-[14px] font-medium text-[var(--text-secondary)]"
        >
          Cancelar
        </button>

        <div className="flex gap-2">
          {mode === "manual" && (
            <button
              type="button"
              onClick={handleGenerateMock}
              className="flex items-center gap-1.5 rounded-[10px] border border-[var(--input-border)] bg-[var(--input-bg)] px-[18px] py-2.5 text-[13px] font-medium text-[var(--text-secondary)]"
            >
              <FileText size={14} />
              Generar datos mock
            </button>
          )}

          <button
            type="button"
            onClick={canSave ? handleSave : undefined}
            disabled={!canSave || isSaving}
            className="flex items-center gap-[7px] rounded-[10px] border-none px-6 py-2.5 text-[14px] font-semibold transition-all duration-200"
            style={{
              background: canSave
                ? "linear-gradient(135deg, #f97316, #ea580c)"
                : "rgba(148,163,184,0.15)",
              color: canSave ? "white" : "var(--text-muted)",
              cursor: canSave ? "pointer" : "not-allowed",
              boxShadow: canSave ? "0 4px 16px rgba(249,115,22,0.25)" : "none",
            }}
          >
            {saved ? <Check size={16} /> : <Upload size={16} />}
            {saved ? "Guardada!" : isSaving ? "Guardando..." : "Guardar actividad"}
          </button>
        </div>
      </div>

      {/* Success toast */}
      {saved && (
        <div
          className="fixed bottom-6 right-6 z-[300] flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-semibold text-white shadow-lg"
          style={{ background: "#22c55e", boxShadow: "0 8px 32px rgba(34,197,94,0.3)" }}
        >
          <Check size={18} />
          Actividad guardada correctamente
        </div>
      )}
    </div>
  );
}
