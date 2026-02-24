import { describe, it, expect } from "vitest";
import { haversineDistance } from "./haversine";

describe("haversineDistance", () => {
  it("Madrid -> Barcelona ~ 504 km (+-1%)", () => {
    const distance = haversineDistance(40.4168, -3.7038, 41.3874, 2.1686);
    const distanceKm = distance / 1000;
    expect(distanceKm).toBeGreaterThan(504 * 0.99);
    expect(distanceKm).toBeLessThan(504 * 1.01);
  });

  it("puntos identicos = 0", () => {
    const distance = haversineDistance(0, 0, 0, 0);
    expect(distance).toBe(0);
  });

  it("puntos identicos no triviales = 0", () => {
    const distance = haversineDistance(40.4168, -3.7038, 40.4168, -3.7038);
    expect(distance).toBe(0);
  });

  it("puntos muy cercanos (~10m)", () => {
    // ~10m al norte desde un punto arbitrario
    // 1 grado lat ~ 111,320m, asi que ~10m = ~0.0000899 grados
    const lat1 = 40.4168;
    const lon1 = -3.7038;
    const lat2 = lat1 + 0.0000899;
    const lon2 = lon1;
    const distance = haversineDistance(lat1, lon1, lat2, lon2);
    expect(distance).toBeGreaterThan(9);
    expect(distance).toBeLessThan(11);
  });

  it("cruce de meridiano (179.9 -> -179.9)", () => {
    const distance = haversineDistance(0, 179.9, 0, -179.9);
    const distanceKm = distance / 1000;
    // 0.2 grados de diferencia en longitud en el ecuador
    // 1 grado de longitud en el ecuador ~ 111.32 km, asi que 0.2 ~ 22.26 km
    expect(distanceKm).toBeGreaterThan(22 * 0.99);
    expect(distanceKm).toBeLessThan(22.5 * 1.01);
  });

  it("hemisferios opuestos: polo norte -> polo sur ~ 20015 km", () => {
    const distance = haversineDistance(90, 0, -90, 0);
    const distanceKm = distance / 1000;
    // Medio perimetro terrestre ~ pi * R = 20015.09 km
    expect(distanceKm).toBeGreaterThan(20015 * 0.99);
    expect(distanceKm).toBeLessThan(20015 * 1.01);
  });

  it("cuarto de vuelta: ecuador al polo norte ~ 10007 km", () => {
    const distance = haversineDistance(0, 0, 90, 0);
    const distanceKm = distance / 1000;
    expect(distanceKm).toBeGreaterThan(10007 * 0.99);
    expect(distanceKm).toBeLessThan(10008 * 1.01);
  });

  it("es simetrica: d(A,B) === d(B,A)", () => {
    const dAB = haversineDistance(40.4168, -3.7038, 41.3874, 2.1686);
    const dBA = haversineDistance(41.3874, 2.1686, 40.4168, -3.7038);
    expect(dAB).toBeCloseTo(dBA, 10);
  });

  it("distancia solo en longitud en el ecuador", () => {
    // 1 grado de longitud en el ecuador ~ 111.32 km
    const distance = haversineDistance(0, 0, 0, 1);
    const distanceKm = distance / 1000;
    expect(distanceKm).toBeGreaterThan(111 * 0.99);
    expect(distanceKm).toBeLessThan(112 * 1.01);
  });

  it("distancia solo en latitud", () => {
    // 1 grado de latitud ~ 111.19 km
    const distance = haversineDistance(0, 0, 1, 0);
    const distanceKm = distance / 1000;
    expect(distanceKm).toBeGreaterThan(111 * 0.99);
    expect(distanceKm).toBeLessThan(112 * 1.01);
  });

  it("siempre retorna un valor no negativo", () => {
    const distance = haversineDistance(-33.8688, 151.2093, 51.5074, -0.1278);
    expect(distance).toBeGreaterThanOrEqual(0);
  });
});
