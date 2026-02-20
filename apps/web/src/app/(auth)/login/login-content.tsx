"use client";

import { useState } from "react";
import { Zap, Play } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { DemoModal } from "@/components/demo/demo-modal";
import { LoginButton } from "./login-button";

export function LoginContent() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[image:var(--hero-bg)]">
      {/* Glow effects */}
      <div className="pointer-events-none absolute -right-[200px] -top-[200px] z-0 h-[600px] w-[600px] rounded-full bg-[var(--glow-orange)] blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-[200px] -left-[200px] z-0 h-[500px] w-[500px] rounded-full bg-[var(--glow-blue)] blur-[100px]" />

      {/* Theme toggle */}
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle showLabel />
      </div>

      {/* Main content */}
      <div className="z-[1] flex w-full max-w-[960px] flex-col items-center gap-8 p-5 md:flex-row md:gap-[60px] md:p-10">
        {/* Hero branding */}
        <div className="flex-1 text-center md:text-left">
          {/* Logo */}
          <div className="mb-6 flex items-center justify-center gap-3 md:justify-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30">
              <Zap className="h-[26px] w-[26px] text-white" />
            </div>
            <span className="text-2xl font-bold text-[var(--text-primary)]">Cycling Companion</span>
          </div>

          {/* Headline */}
          <h1 className="text-[28px] font-bold leading-[1.2] tracking-[-0.03em] text-[var(--text-primary)] md:text-[40px]">
            Tu entrenador IA
            <br />
            <span className="text-orange-500">que entiende tus datos</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)] opacity-85 md:text-base">
            Análisis inteligente, planes personalizados y recomendaciones basadas en ciencia para
            ciclistas que quieren mejorar.
          </p>

          {/* Feature list (desktop only) */}
          <div className="mt-8 hidden flex-col gap-3 md:flex">
            {[
              { emoji: "📊", text: "Análisis inteligente de tus sesiones" },
              { emoji: "🗓️", text: "Planificación semanal adaptada a ti" },
              { emoji: "🧠", text: "IA que te explica qué hacer y por qué" },
            ].map((feature) => (
              <div
                key={feature.text}
                className="flex items-center gap-3 text-sm text-[var(--text-secondary)]"
              >
                <span className="text-lg">{feature.emoji}</span>
                {feature.text}
              </div>
            ))}
          </div>
        </div>

        {/* Login card */}
        <div className="w-full rounded-[20px] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-xl backdrop-blur-sm md:w-[380px] md:p-10">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Comienza ahora</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Conecta tu cuenta para empezar a entrenar de forma inteligente
            </p>
          </div>

          <LoginButton />

          {/* Demo button */}
          <button
            onClick={() => setShowDemo(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--input-border)] bg-transparent px-4 py-3 text-[14px] font-medium text-[var(--text-secondary)] transition-all duration-200 hover:border-orange-500/40 hover:bg-orange-500/[0.06] hover:text-orange-500"
          >
            <Play className="h-4 w-4" />
            Explorar demo
          </button>

          <p className="mt-6 text-center text-[11px] leading-[1.5] text-[var(--text-muted)]">
            Al continuar, aceptas nuestros términos de servicio y política de privacidad.
          </p>
        </div>
      </div>

      {/* Demo modal */}
      {showDemo && <DemoModal onClose={() => setShowDemo(false)} />}
    </div>
  );
}
