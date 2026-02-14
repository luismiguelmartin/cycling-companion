"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  href?: string;
  label?: string;
}

export function BackButton({ href, label = "Volver" }: BackButtonProps) {
  const router = useRouter();

  const content = (
    <>
      <div className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--input-border)] bg-[var(--input-bg)]">
        <ArrowLeft className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
      </div>
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center gap-2 cursor-pointer"
        aria-label={label}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push("/activities");
        }
      }}
      className="inline-flex items-center gap-2 cursor-pointer"
      aria-label={label}
    >
      {content}
    </button>
  );
}
