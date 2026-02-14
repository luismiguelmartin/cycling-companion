import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RPEIndicator } from "./rpe-indicator";

describe("RPEIndicator", () => {
  it("renderiza 10 barras", () => {
    const { container } = render(<RPEIndicator value={5} />);
    const bars = container.querySelectorAll('[role="img"] > div');
    expect(bars).toHaveLength(10);
  });

  it('tiene aria-label "RPE 5 de 10" para value=5', () => {
    render(<RPEIndicator value={5} />);
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "RPE 5 de 10");
  });

  it('tiene aria-label "RPE no registrado" cuando value es null', () => {
    render(<RPEIndicator value={null} />);
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "RPE no registrado");
  });

  it("las barras activas tienen opacidad 1 y las inactivas 0.2", () => {
    const { container } = render(<RPEIndicator value={3} />);
    const bars = container.querySelectorAll('[role="img"] > div');

    // Las 3 primeras barras son activas
    for (let i = 0; i < 3; i++) {
      expect(bars[i]).toHaveStyle({ opacity: 1 });
    }
    // Las 7 siguientes son inactivas
    for (let i = 3; i < 10; i++) {
      expect(bars[i]).toHaveStyle({ opacity: 0.2 });
    }
  });

  it("cuando value es null, todas las barras son inactivas", () => {
    const { container } = render(<RPEIndicator value={null} />);
    const bars = container.querySelectorAll('[role="img"] > div');

    for (let i = 0; i < 10; i++) {
      expect(bars[i]).toHaveStyle({ opacity: 0.2 });
    }
  });
});
