const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Whole calendar days from `now` (UTC date) until `isoDate`. Null if the date is blank or invalid. */
export function daysUntil(isoDate: string, now: Date): number | null {
  const match = ISO_DATE.exec(isoDate.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const target = Date.UTC(year, month - 1, day);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((target - today) / 86_400_000);
}

export function countdownLabel(days: number | null): string {
  if (days === null) return "Ajoutez une date pour lancer le compte à rebours.";
  if (days > 1) return `Dans ${days} jours`;
  if (days === 1) return "Demain";
  if (days === 0) return "Aujourd'hui";
  return "Le grand jour est passé";
}
