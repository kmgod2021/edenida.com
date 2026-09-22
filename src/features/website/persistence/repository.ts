import type { SiteDocument } from "@/features/website/domain/types";

/**
 * Persistence port for the website builder.
 *
 * Wave A ships a memory adapter only. The Supabase adapter must be a
 * server-only module (never imported into client components) and must use
 * the user session, not the service role. See HANDOFF.md.
 */
export interface WebsiteRepository {
  getSite(weddingId: string): Promise<SiteDocument | null>;
  saveSite(site: SiteDocument): Promise<void>;
}

export class WebsiteLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebsiteLoadError";
  }
}

export class WebsitePersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebsitePersistenceError";
  }
}
