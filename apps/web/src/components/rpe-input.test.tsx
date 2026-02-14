import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RPEInput } from "./rpe-input";

describe("RPEInput", () => {
  it("renderiza 10 barras (botones)", () => {
    render(<RPEInput value={0} onChange={vi.fn()} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(10);
  });

  it('renderiza el label "Esfuerzo percibido (RPE)"', () => {
    render(<RPEInput value={0} onChange={vi.fn()} />);
    expect(screen.getByText("Esfuerzo percibido (RPE)")).toBeInTheDocument();
  });

  it("tiene role=slider con aria attributes correctos", () => {
    render(<RPEInput value={7} onChange={vi.fn()} />);
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-valuemin", "1");
    expect(slider).toHaveAttribute("aria-valuemax", "10");
    expect(slider).toHaveAttribute("aria-valuenow", "7");
    expect(slider).toHaveAttribute("aria-label", "Esfuerzo percibido");
  });

  it("llama onChange con el número de la barra al hacer clic", () => {
    const onChange = vi.fn();
    render(<RPEInput value={0} onChange={onChange} />);
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[4]); // barra 5 (0-indexed)
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("muestra label semántico cuando value > 0", () => {
    render(<RPEInput value={7} onChange={vi.fn()} />);
    expect(screen.getByText("7/10 — Muy duro")).toBeInTheDocument();
  });

  it("no muestra label semántico cuando value es 0", () => {
    render(<RPEInput value={0} onChange={vi.fn()} />);
    expect(screen.queryByText(/\/10 —/)).not.toBeInTheDocument();
  });

  it("muestra label correcto para RPE 1 (Muy fácil)", () => {
    render(<RPEInput value={1} onChange={vi.fn()} />);
    expect(screen.getByText("1/10 — Muy fácil")).toBeInTheDocument();
  });

  it("muestra label correcto para RPE 10 (Límite absoluto)", () => {
    render(<RPEInput value={10} onChange={vi.fn()} />);
    expect(screen.getByText("10/10 — Límite absoluto")).toBeInTheDocument();
  });

  it("las barras muestran números del 1 al 10", () => {
    render(<RPEInput value={0} onChange={vi.fn()} />);
    const buttons = screen.getAllByRole("button");
    for (let i = 0; i < 10; i++) {
      expect(buttons[i]).toHaveTextContent(String(i + 1));
    }
  });
});
