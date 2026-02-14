import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StepIndicator } from "./step-indicator";

describe("StepIndicator", () => {
  it("renderiza el número correcto de dots", () => {
    const { container } = render(<StepIndicator current={0} total={4} />);
    const dots = container.querySelectorAll("[class*='rounded']");
    expect(dots).toHaveLength(4);
  });

  it("marca el dot activo con ancho expandido", () => {
    const { container } = render(<StepIndicator current={1} total={4} />);
    const dots = container.querySelectorAll("[class*='rounded']");
    // El dot activo (índice 1) debe tener clase w-8
    expect(dots[1].className).toContain("w-8");
    // Los demás no deben tener w-8
    expect(dots[0].className).toContain("w-2");
    expect(dots[2].className).toContain("w-2");
    expect(dots[3].className).toContain("w-2");
  });

  it("marca dots completados con opacidad", () => {
    const { container } = render(<StepIndicator current={2} total={4} />);
    const dots = container.querySelectorAll("[class*='rounded']");
    // Dots 0 y 1 están completados (bg-orange-500/50)
    expect(dots[0].className).toContain("bg-orange-500/50");
    expect(dots[1].className).toContain("bg-orange-500/50");
    // Dot 2 es activo
    expect(dots[2].className).toContain("w-8");
    // Dot 3 es pendiente
    expect(dots[3].className).toContain("bg-slate-600/30");
  });

  it("tiene aria-label con el paso actual", () => {
    render(<StepIndicator current={2} total={4} />);
    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toHaveAttribute("aria-label", "Paso 3 de 4");
  });
});
