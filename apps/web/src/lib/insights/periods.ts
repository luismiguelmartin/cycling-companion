import { getWeekStart } from "@/lib/dashboard/calculations";

export interface PeriodRange {
  start: string;
  end: string;
  label: string;
}

function formatWeekRange(start: Date, end: Date): string {
  const months = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
  ];
  return `${start.getDate()} — ${end.getDate()} ${months[end.getMonth()]}`;
}

export function getDefaultPeriods(): { periodA: PeriodRange; periodB: PeriodRange } {
  const now = new Date();
  const currentWeekStart = getWeekStart(now);

  const prevWeekStart = new Date(currentWeekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevWeekEnd = new Date(currentWeekStart);
  prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);

  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);

  return {
    periodA: {
      start: prevWeekStart.toISOString().split("T")[0],
      end: prevWeekEnd.toISOString().split("T")[0],
      label: formatWeekRange(prevWeekStart, prevWeekEnd),
    },
    periodB: {
      start: currentWeekStart.toISOString().split("T")[0],
      end: currentWeekEnd.toISOString().split("T")[0],
      label: formatWeekRange(currentWeekStart, currentWeekEnd),
    },
  };
}
