import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { StravaConnect } from "./strava-connect";
import type { StravaConnectionStatus } from "shared";

// Mock next/navigation
const mockReplace = vi.fn();
const mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}));

// Mock API client
const mockApiClientFetch = vi.fn();
const mockApiClientPost = vi.fn();
const mockApiClientDelete = vi.fn();
vi.mock("@/lib/api/client", () => ({
  apiClientFetch: (...args: unknown[]) => mockApiClientFetch(...args),
  apiClientPost: (...args: unknown[]) => mockApiClientPost(...args),
  apiClientDelete: (...args: unknown[]) => mockApiClientDelete(...args),
}));

const disconnectedStatus: StravaConnectionStatus = {
  connected: false,
  athlete_name: null,
  strava_athlete_id: null,
  connected_at: null,
  last_sync_at: null,
  activities_count: 0,
};

const connectedStatus: StravaConnectionStatus = {
  connected: true,
  athlete_name: null,
  strava_athlete_id: 12345,
  connected_at: "2025-01-15T10:00:00Z",
  last_sync_at: "2025-01-15T12:00:00Z",
  activities_count: 24,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("StravaConnect", () => {
  describe("Estado desconectado", () => {
    it("muestra boton Conectar con Strava cuando no esta conectado", () => {
      render(<StravaConnect initialStatus={disconnectedStatus} />);
      expect(screen.getByRole("button", { name: /conectar con strava/i })).toBeInTheDocument();
    });

    it("muestra mensaje de sincronizacion automatica", () => {
      render(<StravaConnect initialStatus={disconnectedStatus} />);
      expect(screen.getByText(/sincronizar actividades/i)).toBeInTheDocument();
    });

    it("muestra referencia a importar .fit/.gpx", () => {
      render(<StravaConnect initialStatus={disconnectedStatus} />);
      expect(screen.getByText(/\.fit\/\.gpx/)).toBeInTheDocument();
    });
  });

  describe("Estado conectado", () => {
    it("muestra estado conectado y actividades importadas", () => {
      render(<StravaConnect initialStatus={connectedStatus} />);
      expect(screen.getByText("Conectado")).toBeInTheDocument();
      expect(screen.getByText(/24/)).toBeInTheDocument();
    });

    it("muestra botones Importar historial y Desconectar", () => {
      render(<StravaConnect initialStatus={connectedStatus} />);
      expect(screen.getByText("Importar historial")).toBeInTheDocument();
      expect(screen.getByText("Desconectar")).toBeInTheDocument();
    });

    it("muestra Nunca sincronizado si last_sync_at es null", () => {
      const status = { ...connectedStatus, last_sync_at: null };
      render(<StravaConnect initialStatus={status} />);
      expect(screen.getByText(/Nunca sincronizado/)).toBeInTheDocument();
    });

    it("muestra Sin actividades importadas si count es 0", () => {
      const status = { ...connectedStatus, activities_count: 0 };
      render(<StravaConnect initialStatus={status} />);
      expect(screen.getByText(/Sin actividades importadas/)).toBeInTheDocument();
    });
  });

  describe("Acciones", () => {
    it("click conectar llama GET /strava/auth-url", async () => {
      mockApiClientFetch.mockResolvedValue({ data: { url: "https://strava.com/oauth" } });

      const originalLocation = window.location;
      Object.defineProperty(window, "location", {
        writable: true,
        value: { ...originalLocation, href: "" },
      });

      render(<StravaConnect initialStatus={disconnectedStatus} />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /conectar con strava/i }));
      });

      await waitFor(() => {
        expect(mockApiClientFetch).toHaveBeenCalledWith("/strava/auth-url");
      });

      Object.defineProperty(window, "location", { writable: true, value: originalLocation });
    });

    it("click importar historial llama POST /strava/sync", async () => {
      mockApiClientPost.mockResolvedValue({
        data: { imported: 5, skipped: 10, errors: 0 },
      });
      mockApiClientFetch.mockResolvedValue({ data: connectedStatus });

      render(<StravaConnect initialStatus={connectedStatus} />);
      await act(async () => {
        fireEvent.click(screen.getByText("Importar historial"));
      });

      await waitFor(() => {
        expect(mockApiClientPost).toHaveBeenCalledWith("/strava/sync", { count: 30 });
      });
    });

    it("muestra resultado de sync tras importar", async () => {
      mockApiClientPost.mockResolvedValue({
        data: { imported: 12, skipped: 18, errors: 0 },
      });
      mockApiClientFetch.mockResolvedValue({ data: connectedStatus });

      render(<StravaConnect initialStatus={connectedStatus} />);
      await act(async () => {
        fireEvent.click(screen.getByText("Importar historial"));
      });

      await waitFor(() => {
        expect(screen.getByText(/12 actividades importadas/)).toBeInTheDocument();
        expect(screen.getByText(/18 ya existentes/)).toBeInTheDocument();
      });
    });

    it("click desconectar con confirmacion llama DELETE /strava/disconnect", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(true);
      mockApiClientDelete.mockResolvedValue({ data: { disconnected: true } });

      render(<StravaConnect initialStatus={connectedStatus} />);
      await act(async () => {
        fireEvent.click(screen.getByText("Desconectar"));
      });

      await waitFor(() => {
        expect(mockApiClientDelete).toHaveBeenCalledWith("/strava/disconnect");
      });
    });

    it("cancelar desconexion no llama API", () => {
      vi.spyOn(window, "confirm").mockReturnValue(false);

      render(<StravaConnect initialStatus={connectedStatus} />);
      fireEvent.click(screen.getByText("Desconectar"));

      expect(mockApiClientDelete).not.toHaveBeenCalled();
    });

    it("muestra error si sync falla", async () => {
      mockApiClientPost.mockRejectedValue(new Error("API 500"));

      render(<StravaConnect initialStatus={connectedStatus} />);
      await act(async () => {
        fireEvent.click(screen.getByText("Importar historial"));
      });

      await waitFor(() => {
        expect(screen.getByText(/Error al importar actividades/)).toBeInTheDocument();
      });
    });
  });
});
