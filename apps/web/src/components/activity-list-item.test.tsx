import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActivityListItem } from "./activity-list-item";

const baseProps = {
  id: "abc123",
  name: "Rodada matutina",
  date: "2024-06-15T07:00:00Z",
  type: "endurance",
  distanceKm: 52.3,
  durationFormatted: "1h 45m",
  avgPower: 205,
  avgHR: 156,
};

describe("ActivityListItem RPE label", () => {
  it("muestra número y descripción combinados en tooltip cuando rpe tiene valor", () => {
    render(<ActivityListItem {...baseProps} rpe={7} />);
    expect(screen.getByText("7: Alto, esfuerzo sostenido")).toBeInTheDocument();
  });

  it("no muestra tooltip cuando rpe es null", () => {
    render(<ActivityListItem {...baseProps} rpe={null} />);
    // Sin número RPE no hay tooltip con descripción
    expect(screen.queryByText(/\d+:.*$/)).not.toBeInTheDocument();
  });

  it("muestra número y descripción combinados en tooltip para rpe=3", () => {
    render(<ActivityListItem {...baseProps} rpe={3} />);
    expect(screen.getByText("3: Ligero, respiración cómoda")).toBeInTheDocument();
  });

  it("muestra número y descripción combinados en tooltip para rpe=10", () => {
    render(<ActivityListItem {...baseProps} rpe={10} />);
    expect(screen.getByText("10: Esfuerzo total, sprint máximo")).toBeInTheDocument();
  });
});
