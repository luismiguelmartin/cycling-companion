import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SelectField } from "./select-field";

const OPTIONS = [
  { value: "endurance", label: "Resistencia" },
  { value: "intervals", label: "Intervalos" },
  { value: "recovery", label: "Recuperación" },
];

describe("SelectField", () => {
  it("renderiza el label", () => {
    render(<SelectField label="Tipo" value="endurance" onChange={vi.fn()} options={OPTIONS} />);
    expect(screen.getByText("Tipo")).toBeInTheDocument();
  });

  it("renderiza todas las opciones", () => {
    render(<SelectField label="Tipo" value="endurance" onChange={vi.fn()} options={OPTIONS} />);
    const select = screen.getByRole("combobox");
    const options = select.querySelectorAll("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent("Resistencia");
    expect(options[1]).toHaveTextContent("Intervalos");
    expect(options[2]).toHaveTextContent("Recuperación");
  });

  it("muestra asterisco rojo cuando required es true", () => {
    render(
      <SelectField label="Tipo" value="endurance" onChange={vi.fn()} options={OPTIONS} required />,
    );
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("no muestra asterisco cuando required es false", () => {
    render(<SelectField label="Tipo" value="endurance" onChange={vi.fn()} options={OPTIONS} />);
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("tiene el valor seleccionado correcto", () => {
    render(<SelectField label="Tipo" value="intervals" onChange={vi.fn()} options={OPTIONS} />);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("intervals");
  });
});
