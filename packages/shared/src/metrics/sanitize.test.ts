import { describe, it, expect } from "vitest";
import { sanitizeTrackPoints } from "./sanitize";
import type { TrackPoint } from "./types";

/** Helper para crear un TrackPoint con valores por defecto */
function makePoint(overrides: Partial<TrackPoint> = {}): TrackPoint {
  return {
    timestamp: 1000,
    lat: 40.4168,
    lon: -3.7038,
    elevation: 650,
    power: 200,
    hr: 150,
    cadence: 90,
    ...overrides,
  };
}

describe("sanitizeTrackPoints", () => {
  describe("power", () => {
    it("anula power 2001 (supera MAX_POWER_WATTS)", () => {
      const result = sanitizeTrackPoints([makePoint({ power: 2001 })]);
      expect(result[0].power).toBeNull();
    });

    it("mantiene power 2000 (límite exacto)", () => {
      const result = sanitizeTrackPoints([makePoint({ power: 2000 })]);
      expect(result[0].power).toBe(2000);
    });

    it("anula power -5 (negativo)", () => {
      const result = sanitizeTrackPoints([makePoint({ power: -5 })]);
      expect(result[0].power).toBeNull();
    });

    it("mantiene power 0 (válido, ciclista parado)", () => {
      const result = sanitizeTrackPoints([makePoint({ power: 0 })]);
      expect(result[0].power).toBe(0);
    });
  });

  describe("hr", () => {
    it("anula hr 231 (supera MAX_HR_BPM)", () => {
      const result = sanitizeTrackPoints([makePoint({ hr: 231 })]);
      expect(result[0].hr).toBeNull();
    });

    it("mantiene hr 230 (límite exacto)", () => {
      const result = sanitizeTrackPoints([makePoint({ hr: 230 })]);
      expect(result[0].hr).toBe(230);
    });

    it("anula hr 0 (no válido)", () => {
      const result = sanitizeTrackPoints([makePoint({ hr: 0 })]);
      expect(result[0].hr).toBeNull();
    });

    it("anula hr -1 (negativo)", () => {
      const result = sanitizeTrackPoints([makePoint({ hr: -1 })]);
      expect(result[0].hr).toBeNull();
    });
  });

  describe("cadence", () => {
    it("anula cadence -1 (negativo)", () => {
      const result = sanitizeTrackPoints([makePoint({ cadence: -1 })]);
      expect(result[0].cadence).toBeNull();
    });

    it("mantiene cadence 0 (válido)", () => {
      const result = sanitizeTrackPoints([makePoint({ cadence: 0 })]);
      expect(result[0].cadence).toBe(0);
    });
  });

  describe("casos generales", () => {
    it("no modifica valores normales", () => {
      const point = makePoint({ power: 200, hr: 150, cadence: 90 });
      const result = sanitizeTrackPoints([point]);
      expect(result[0].power).toBe(200);
      expect(result[0].hr).toBe(150);
      expect(result[0].cadence).toBe(90);
    });

    it("devuelve array vacío para entrada vacía", () => {
      const result = sanitizeTrackPoints([]);
      expect(result).toEqual([]);
    });

    it("no muta el array original", () => {
      const original = [makePoint({ power: 2001, hr: 231, cadence: -1 })];
      const originalPower = original[0].power;
      const originalHr = original[0].hr;
      const originalCadence = original[0].cadence;

      const result = sanitizeTrackPoints(original);

      // El original no debe cambiar
      expect(original[0].power).toBe(originalPower);
      expect(original[0].hr).toBe(originalHr);
      expect(original[0].cadence).toBe(originalCadence);

      // El resultado sí debe estar sanitizado
      expect(result[0].power).toBeNull();
      expect(result[0].hr).toBeNull();
      expect(result[0].cadence).toBeNull();

      // Son referencias distintas
      expect(result[0]).not.toBe(original[0]);
    });
  });
});
