import { z } from "zod";

import { isValidIsoDate } from "./dates";
import type { WeddingDetailsInput } from "./types";

export const WEDDING_TIMEZONE_IDS = [
  "America/Toronto",
  "America/Winnipeg",
  "America/Edmonton",
  "America/Vancouver",
  "America/Halifax",
  "America/St_Johns",
  "Europe/Paris",
  "UTC",
] as const;

export type WeddingTimezoneId = (typeof WEDDING_TIMEZONE_IDS)[number];

export const WEDDING_TIMEZONE_LABELS: Record<WeddingTimezoneId, string> = {
  "America/Toronto": "Est — Toronto",
  "America/Winnipeg": "Centre — Winnipeg",
  "America/Edmonton": "Rocheuses — Edmonton",
  "America/Vancouver": "Pacifique — Vancouver",
  "America/Halifax": "Atlantique — Halifax",
  "America/St_Johns": "Terre-Neuve",
  "Europe/Paris": "Paris",
  UTC: "UTC",
};

export const WEDDING_CURRENCY_IDS = ["CAD", "USD", "EUR"] as const;

export type WeddingCurrencyId = (typeof WEDDING_CURRENCY_IDS)[number];

export const WEDDING_CURRENCY_LABELS: Record<WeddingCurrencyId, string> = {
  CAD: "Dollar canadien (CAD)",
  USD: "Dollar américain (USD)",
  EUR: "Euro (EUR)",
};

export const DEFAULT_WEDDING_TIMEZONE: WeddingTimezoneId = "America/Toronto";
export const DEFAULT_WEDDING_CURRENCY: WeddingCurrencyId = "CAD";

export const weddingDetailsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Le titre du mariage est requis")
    .max(80, "80 caractères maximum"),
  partnerName: z.string().trim().max(80, "80 caractères maximum"),
  weddingDate: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || isValidIsoDate(value),
      "Date invalide",
    ),
  timezone: z.enum(WEDDING_TIMEZONE_IDS, "Fuseau horaire invalide"),
  currency: z.enum(WEDDING_CURRENCY_IDS, "Devise invalide"),
});

export function toWeddingDetails(
  parsed: z.infer<typeof weddingDetailsSchema>,
): WeddingDetailsInput {
  return {
    title: parsed.title,
    partnerName: parsed.partnerName.length > 0 ? parsed.partnerName : null,
    weddingDate: parsed.weddingDate.length > 0 ? parsed.weddingDate : null,
    timezone: parsed.timezone,
    currency: parsed.currency,
  };
}

export function detailsToFormValues(details: WeddingDetailsInput): {
  title: string;
  partnerName: string;
  weddingDate: string;
  timezone: string;
  currency: string;
} {
  return {
    title: details.title,
    partnerName: details.partnerName ?? "",
    weddingDate: details.weddingDate ?? "",
    timezone: details.timezone,
    currency: details.currency,
  };
}
