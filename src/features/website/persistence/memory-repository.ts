import type { SiteDocument } from "@/features/website/domain/types";
import { createEmptySite, createSampleSite } from "@/features/website/fixtures/site";
import {
  WebsiteLoadError,
  WebsitePersistenceError,
  type WebsiteRepository,
} from "@/features/website/persistence/repository";

export type FixtureMode = "sample" | "empty" | "error";

export function createMemoryWebsiteRepository(mode: FixtureMode): WebsiteRepository {
  return {
    async getSite(weddingId: string) {
      if (!weddingId.trim()) return null;
      if (mode === "error") {
        throw new WebsiteLoadError(
          "Nous n'avons pas pu charger ce site. Réessayez dans un instant.",
        );
      }
      if (mode === "empty") return createEmptySite(weddingId);
      return createSampleSite(weddingId);
    },
    async saveSite() {
      throw new WebsitePersistenceError(
        "L'enregistrement n'est pas branché. Le brouillon reste dans cette session.",
      );
    },
  };
}

export async function loadFixtureSite(
  weddingId: string,
  fixture: string | undefined,
): Promise<SiteDocument> {
  const mode: FixtureMode =
    fixture === "empty" ? "empty" : fixture === "error" ? "error" : "sample";
  const repository = createMemoryWebsiteRepository(mode);
  const site = await repository.getSite(weddingId);
  if (!site) {
    throw new WebsiteLoadError("Aucun site pour ce mariage.");
  }
  return site;
}
