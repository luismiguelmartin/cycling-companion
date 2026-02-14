import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DurationInput } from "./duration-input";

describe("DurationInput", () => {
  const defaultProps = {
    hours: "",
    minutes: "",
    seconds: "",
    onHoursChange: vi.fn(),
    onMinutesChange: vi.fn(),
    onSecondsChange: vi.fn(),
  };

  it('renderiza el label "Duración"', () => {
    render(<DurationInput {...defaultProps} />);
    expect(screen.getByText("Duración")).toBeInTheDocument();
  });

  it("renderiza 3 inputs", () => {
    render(<DurationInput {...defaultProps} />);
    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(3);
  });

  it('renderiza las unidades "h", "min", "seg"', () => {
    render(<DurationInput {...defaultProps} />);
    expect(screen.getByText("h")).toBeInTheDocument();
    expect(screen.getByText("min")).toBeInTheDocument();
    expect(screen.getByText("seg")).toBeInTheDocument();
  });

  it("muestra los valores proporcionados", () => {
    render(<DurationInput {...defaultProps} hours="2" minutes="30" seconds="15" />);
    const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
    expect(inputs[0].value).toBe("2");
    expect(inputs[1].value).toBe("30");
    expect(inputs[2].value).toBe("15");
  });

  it("muestra asterisco rojo cuando required es true", () => {
    render(<DurationInput {...defaultProps} required />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("no muestra asterisco cuando required es false", () => {
    render(<DurationInput {...defaultProps} />);
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it('tiene placeholders "1", "45", "00"', () => {
    render(<DurationInput {...defaultProps} />);
    expect(screen.getByPlaceholderText("1")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("45")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("00")).toBeInTheDocument();
  });
});
