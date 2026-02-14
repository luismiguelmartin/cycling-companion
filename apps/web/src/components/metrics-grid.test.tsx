import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetricsGrid, type MetricItem } from "./metrics-grid";

const mockMetrics: MetricItem[] = [
  { icon: <span data-testid="icon-1" />, label: "Dist.", value: "52.3", unit: "km" },
  { icon: <span data-testid="icon-2" />, label: "Tiempo", value: "1h 45m", unit: "" },
  { icon: <span data-testid="icon-3" />, label: "Pot.", value: "205", unit: "W" },
  { icon: <span data-testid="icon-4" />, label: "FC", value: "156", unit: "bpm" },
  { icon: <span data-testid="icon-5" />, label: "Cadencia", value: "—", unit: "" },
  { icon: <span data-testid="icon-6" />, label: "TSS", value: "85", unit: "" },
];

describe("MetricsGrid", () => {
  it("renderiza el número correcto de cards", () => {
    render(<MetricsGrid metrics={mockMetrics} />);
    expect(screen.getAllByText(/Dist\.|Tiempo|Pot\.|FC|Cadencia|TSS/)).toHaveLength(6);
  });

  it("muestra los valores correctamente", () => {
    render(<MetricsGrid metrics={mockMetrics} />);
    expect(screen.getByText("52.3")).toBeInTheDocument();
    expect(screen.getByText("1h 45m")).toBeInTheDocument();
    expect(screen.getByText("205")).toBeInTheDocument();
  });

  it("muestra las unidades correctamente", () => {
    render(<MetricsGrid metrics={mockMetrics} />);
    expect(screen.getByText("km")).toBeInTheDocument();
    expect(screen.getByText("W")).toBeInTheDocument();
    expect(screen.getByText("bpm")).toBeInTheDocument();
  });

  it('muestra "—" para valores null', () => {
    render(<MetricsGrid metrics={mockMetrics} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
