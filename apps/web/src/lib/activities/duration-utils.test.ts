import { describe, it, expect } from "vitest";
import { durationToSeconds, secondsToDuration } from "./duration-utils";

describe("durationToSeconds", () => {
  it('convierte "1"/"30"/"0" a 5400 segundos', () => {
    expect(durationToSeconds("1", "30", "0")).toBe(5400);
  });

  it('convierte "0"/"0"/"30" a 30 segundos', () => {
    expect(durationToSeconds("0", "0", "30")).toBe(30);
  });

  it('convierte ""/""/""  a 0 segundos', () => {
    expect(durationToSeconds("", "", "")).toBe(0);
  });

  it('convierte "2"/"15"/"45" a 8145 segundos', () => {
    expect(durationToSeconds("2", "15", "45")).toBe(8145);
  });

  it('convierte "0"/"45"/"" a 2700 segundos', () => {
    expect(durationToSeconds("0", "45", "")).toBe(2700);
  });

  it("trata valores no numéricos como 0", () => {
    expect(durationToSeconds("abc", "xyz", "")).toBe(0);
  });
});

describe("secondsToDuration", () => {
  it("convierte 5400 a { h: '1', m: '30', s: '00' }", () => {
    expect(secondsToDuration(5400)).toEqual({ h: "1", m: "30", s: "00" });
  });

  it("convierte 0 a { h: '0', m: '00', s: '00' }", () => {
    expect(secondsToDuration(0)).toEqual({ h: "0", m: "00", s: "00" });
  });

  it("convierte 30 a { h: '0', m: '00', s: '30' }", () => {
    expect(secondsToDuration(30)).toEqual({ h: "0", m: "00", s: "30" });
  });

  it("convierte 8145 a { h: '2', m: '15', s: '45' }", () => {
    expect(secondsToDuration(8145)).toEqual({ h: "2", m: "15", s: "45" });
  });

  it("padea minutos y segundos a 2 dígitos", () => {
    const result = secondsToDuration(3605); // 1h 0m 5s
    expect(result.m).toBe("00");
    expect(result.s).toBe("05");
  });
});
