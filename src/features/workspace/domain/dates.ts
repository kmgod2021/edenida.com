export function isValidIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** Calendar date YYYY-MM-DD in an IANA timezone. */
export function calendarDateInTimeZone(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addCalendarDays(isoDate: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    throw new Error("Invalid ISO date");
  }
  const utc = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

export function daysUntilWedding(
  weddingDate: string | null,
  now: Date,
  timeZone: string,
): number | null {
  if (!weddingDate) return null;
  const today = calendarDateInTimeZone(now, timeZone);
  const weddingUtc = Date.parse(`${weddingDate}T00:00:00Z`);
  const todayUtc = Date.parse(`${today}T00:00:00Z`);
  return Math.round((weddingUtc - todayUtc) / 86_400_000);
}

export function formatWeddingDate(isoDate: string, locale = "fr-CA"): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12),
  );
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatMoney(
  cents: number,
  currency: string,
  locale = "fr-CA",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function countdownCopy(daysUntil: number | null): {
  primary: string;
  secondary: string;
  label: string;
} {
  if (daysUntil === null) {
    return {
      primary: "Date à choisir",
      secondary: "Ajoutez le jour du mariage pour voir le compte à rebours.",
      label: "Date à choisir",
    };
  }
  if (daysUntil === 0) {
    return {
      primary: "Aujourd'hui",
      secondary: "C'est le jour du mariage.",
      label: "Aujourd'hui, c'est le jour du mariage",
    };
  }
  if (daysUntil > 0) {
    const unit = daysUntil === 1 ? "jour" : "jours";
    return {
      primary: String(daysUntil),
      secondary: unit,
      label: `${daysUntil} ${unit} avant le mariage`,
    };
  }
  const passed = Math.abs(daysUntil);
  const unit = passed === 1 ? "jour" : "jours";
  return {
    primary: `Il y a ${passed} ${unit}`,
    secondary: "Le jour du mariage est passé.",
    label: `Le mariage était il y a ${passed} ${unit}`,
  };
}
