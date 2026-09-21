import { isoDateSchema } from "./schemas";

const MONTHS_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
] as const;

export function addDays(isoDate: string, days: number): string {
  const parsed = isoDateSchema.safeParse(isoDate);
  if (!parsed.success || !Number.isInteger(days)) {
    throw new Error("Invalid ISO date");
  }

  const [year, month, day] = parsed.data.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() + days);

  const nextYear = utc.getUTCFullYear();
  const nextMonth = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(utc.getUTCDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

export function formatIsoDate(isoDate: string): string {
  const parsed = isoDateSchema.safeParse(isoDate);
  if (!parsed.success) return isoDate;

  const [year, month, day] = parsed.data.split("-").map(Number);
  const monthName = MONTHS_FR[month - 1];
  if (!monthName) return parsed.data;
  return `${day} ${monthName} ${year}`;
}

export function utcToday(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}
