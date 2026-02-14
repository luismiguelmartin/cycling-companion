"use client";

import { useCallback, useState } from "react";
import { Check, Trash2, Upload } from "lucide-react";

export interface FileInfo {
  name: string;
  size: number;
  ext: string;
}

interface FileDropZoneProps {
  file: FileInfo | null;
  onFile: (file: FileInfo) => void;
  onClear: () => void;
}

function extractFileInfo(f: File): FileInfo | null {
  const ext = f.name.split(".").pop()?.toLowerCase();
  if (ext && ["fit", "gpx"].includes(ext)) {
    return { name: f.name, size: f.size, ext };
  }
  return null;
}

export function FileDropZone({ file, onFile, onClear }: FileDropZoneProps) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (!f) return;
      const info = extractFileInfo(f);
      if (info) onFile(info);
    },
    [onFile],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const info = extractFileInfo(f);
    if (info) onFile(info);
    e.target.value = "";
  };

  /* ── Estado 3: Con archivo ── */
  if (file) {
    return (
      <div
        className="flex items-center gap-3.5 rounded-[14px] p-5"
        style={{
          background: "var(--success-bg)",
          border: "1px solid var(--success-border)",
        }}
      >
        {/* Icono check */}
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "rgba(34,197,94,0.12)" }}
        >
          <Check size={22} color="#22c55e" />
        </div>

        {/* Info del archivo */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {file.name}
          </p>
          <p className="text-xs" style={{ color: "#22c55e" }}>
            {(file.size / 1024).toFixed(0)} KB &middot; .{file.ext} &middot; Listo para procesar
          </p>
        </div>

        {/* Botón quitar */}
        <button
          type="button"
          onClick={onClear}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg text-xs font-medium"
          style={{
            padding: "6px 12px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#ef4444",
          }}
        >
          <Trash2 size={13} />
          Quitar
        </button>
      </div>
    );
  }

  /* ── Estado 1 & 2: Vacío / Dragging ── */
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => document.getElementById("file-input-drop")?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          document.getElementById("file-input-drop")?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className="cursor-pointer rounded-2xl p-7 text-center transition-all duration-200 md:p-10"
      style={{
        border: dragging ? "2px dashed var(--accent)" : "2px dashed var(--input-border)",
        background: dragging ? "var(--drop-bg)" : "transparent",
      }}
    >
      {/* Contenedor icono */}
      <div
        className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{
          background: dragging ? "rgba(249,115,22,0.10)" : "rgba(148,163,184,0.08)",
        }}
      >
        <Upload size={26} style={{ color: dragging ? "var(--accent)" : "var(--text-muted)" }} />
      </div>

      {/* Texto */}
      <p className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
        Arrastra tu archivo aquí
      </p>
      <p className="mb-3.5 text-[13px]" style={{ color: "var(--text-muted)" }}>
        o haz clic para seleccionar
      </p>

      {/* Badges de extensión */}
      <div className="flex flex-row items-center justify-center gap-2">
        {[".FIT", ".GPX"].map((label) => (
          <span
            key={label}
            className="text-[11px] font-semibold"
            style={{
              padding: "4px 12px",
              borderRadius: 6,
              background: "rgba(148,163,184,0.10)",
              color: "var(--text-muted)",
              letterSpacing: "0.03em",
            }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Input oculto */}
      <input
        id="file-input-drop"
        type="file"
        accept=".fit,.gpx"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
