/**
 * Convierte horas, minutos y segundos (strings) a segundos totales.
 */
export function durationToSeconds(h: string, m: string, s: string): number {
  const hours = parseInt(h) || 0;
  const minutes = parseInt(m) || 0;
  const seconds = parseInt(s) || 0;
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Convierte segundos totales a objeto { h, m, s } como strings.
 */
export function secondsToDuration(totalSeconds: number): { h: string; m: string; s: string } {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return {
    h: String(h),
    m: String(m).padStart(2, "0"),
    s: String(s).padStart(2, "0"),
  };
}
