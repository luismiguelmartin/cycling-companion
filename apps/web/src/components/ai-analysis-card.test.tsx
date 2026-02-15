import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AIAnalysisCard } from "./ai-analysis-card";

const mockAnalysis = {
  summary: "Sesión bien ejecutada con potencia media de 205W.",
  recommendation: "Mañana recuperación activa 1h en Z1.",
  tips: {
    hydration: "Electrolitos +500ml",
    nutrition: "60g carbs 2h",
    sleep: "Mín 8h sueño",
  },
};

describe("AIAnalysisCard", () => {
  it('renderiza el badge "ANÁLISIS IA"', () => {
    render(<AIAnalysisCard analysis={mockAnalysis} activityId="act-1" />);
    expect(screen.getByText("Análisis IA")).toBeInTheDocument();
  });

  it("renderiza el texto de análisis", () => {
    render(<AIAnalysisCard analysis={mockAnalysis} activityId="act-1" />);
    expect(screen.getByText(mockAnalysis.summary)).toBeInTheDocument();
    expect(screen.getByText(mockAnalysis.recommendation)).toBeInTheDocument();
  });

  it("renderiza los tips", () => {
    render(<AIAnalysisCard analysis={mockAnalysis} activityId="act-1" />);
    expect(screen.getByText("Electrolitos +500ml")).toBeInTheDocument();
    expect(screen.getByText("60g carbs 2h")).toBeInTheDocument();
    expect(screen.getByText("Mín 8h sueño")).toBeInTheDocument();
  });

  it("renderiza el estado vacío con botón cuando analysis es null", () => {
    render(<AIAnalysisCard analysis={null} activityId="act-1" />);
    expect(
      screen.getByText(
        "Genera un análisis inteligente de esta actividad con recomendaciones personalizadas.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Generar análisis/ })).toBeInTheDocument();
  });

  it("no renderiza tips si no están definidos", () => {
    const analysisWithoutTips = {
      summary: "Resumen",
      recommendation: "Recomendación",
      tips: {},
    };
    render(<AIAnalysisCard analysis={analysisWithoutTips} activityId="act-1" />);
    expect(screen.queryByText("Electrolitos")).not.toBeInTheDocument();
  });
});
