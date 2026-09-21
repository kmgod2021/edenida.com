import type { VendorCategory, VendorStatus } from "./types";

export const VENDOR_CATEGORY_LABELS: Record<VendorCategory, string> = {
  venue: "Lieu",
  photographer: "Photographe",
  videographer: "Vidéaste",
  caterer: "Traiteur",
  florist: "Fleuriste",
  music: "Musique",
  cake: "Gâteau",
  attire: "Tenue",
  planner: "Wedding planner",
  other: "Autre",
};

export const VENDOR_STATUS_LABELS: Record<VendorStatus, string> = {
  considering: "En réflexion",
  quoted: "Devis reçu",
  booked: "Réservé",
  paid: "Payé",
  declined: "Décliné",
};

export const VENDOR_CATEGORIES = Object.keys(
  VENDOR_CATEGORY_LABELS,
) as VendorCategory[];

export const VENDOR_STATUSES = Object.keys(
  VENDOR_STATUS_LABELS,
) as VendorStatus[];

/** Demo wedding id for Wave A local persistence (no Phase 3 workspace yet). */
export const DEMO_FINANCE_WEDDING_ID = "wedding_demo_finance";
