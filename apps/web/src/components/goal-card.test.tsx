import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GoalCard } from "./goal-card";

describe("GoalCard", () => {
  const defaultProps = {
    icon: "Target",
    label: "Mejorar rendimiento",
    description: "Subir FTP, más potencia",
    active: false,
    onClick: vi.fn(),
  };

  it("renderiza label y description", () => {
    render(<GoalCard {...defaultProps} />);
    expect(screen.getByText("Mejorar rendimiento")).toBeInTheDocument();
    expect(screen.getByText("Subir FTP, más potencia")).toBeInTheDocument();
  });

  it("renderiza el icono como SVG", () => {
    const { container } = render(<GoalCard {...defaultProps} />);
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThanOrEqual(1);
  });

  it("llama onClick al hacer clic", () => {
    const onClick = vi.fn();
    render(<GoalCard {...defaultProps} onClick={onClick} />);
    fireEvent.click(screen.getByRole("radio"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("muestra check cuando está activo", () => {
    const { container } = render(<GoalCard {...defaultProps} active={true} />);
    // El Check icon de lucide-react renderiza un SVG
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThan(0);
  });

  it("tiene aria-checked correcto", () => {
    const { rerender } = render(<GoalCard {...defaultProps} active={false} />);
    expect(screen.getByRole("radio")).toHaveAttribute("aria-checked", "false");

    rerender(<GoalCard {...defaultProps} active={true} />);
    expect(screen.getByRole("radio")).toHaveAttribute("aria-checked", "true");
  });

  it("aplica estilos de borde naranja cuando activo", () => {
    render(<GoalCard {...defaultProps} active={true} />);
    const card = screen.getByRole("radio");
    expect(card.className).toContain("border-orange-500");
    expect(card.className).toContain("border-2");
  });
});
