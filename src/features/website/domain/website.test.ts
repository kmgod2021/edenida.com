import { describe, expect, it } from "vitest";
import { countdownLabel, daysUntil } from "@/features/website/domain/countdown";
import { blankContent } from "@/features/website/domain/content";
import {
  applyTheme,
  moveSection,
  setSectionEnabled,
  switchTemplate,
  updateSectionContent,
} from "@/features/website/domain/operations";
import { assertRegistryCoversCatalog, BLOCKS } from "@/features/website/domain/registry";
import { parseSiteDocument, themeSchema } from "@/features/website/domain/schema";
import { TEMPLATES } from "@/features/website/domain/templates";
import { SECTION_TYPES } from "@/features/website/domain/types";
import { safeHttpsUrl } from "@/features/website/domain/urls";
import { createEmptySite, createSampleSite } from "@/features/website/fixtures/site";
import { createMemoryWebsiteRepository } from "@/features/website/persistence/memory-repository";
import { WebsiteLoadError, WebsitePersistenceError } from "@/features/website/persistence/repository";

describe("website content and presentation", () => {
  it("covers every section type in the block registry", () => {
    expect(() => assertRegistryCoversCatalog()).not.toThrow();
    expect(BLOCKS.map((block) => block.type)).toEqual([...SECTION_TYPES]);
  });

  it("accepts blank content and every template theme", () => {
    for (const type of SECTION_TYPES) {
      const parsed = parseSiteDocument({
        ...createEmptySite("fixture-wedding"),
        sections: createEmptySite("fixture-wedding").sections,
      });
      expect(parsed.success).toBe(true);
      expect(blankContent(type)).toBeTruthy();
    }

    for (const template of TEMPLATES) {
      expect(themeSchema.safeParse(template.defaultTheme).success).toBe(true);
    }
  });

  it("keeps section content identical when the template changes", () => {
    const site = createSampleSite("fixture-wedding");
    const before = JSON.stringify(site.sections);

    const next = switchTemplate(site, "luxury");

    expect(JSON.stringify(next.sections)).toBe(before);
    expect(next.presentation.templateId).toBe("luxury");
    expect(next.presentation.theme).toEqual(
      TEMPLATES.find((template) => template.id === "luxury")?.defaultTheme,
    );
    expect(site.presentation.templateId).toBe("editorial");
    expect(JSON.stringify(site.sections)).toBe(before);
    expect(parseSiteDocument(next).success).toBe(true);
  });

  it("toggles, reorders, and rejects invalid content without mutating the original", () => {
    const site = createSampleSite("fixture-wedding");
    const hero = site.sections[0];
    expect(hero?.type).toBe("hero");
    if (!hero) return;

    const hidden = setSectionEnabled(site, hero.id, false);
    expect(hidden.ok).toBe(true);
    if (!hidden.ok) return;
    expect(hidden.site.sections[0]?.enabled).toBe(false);
    expect(site.sections[0]?.enabled).toBe(true);

    const moved = moveSection(site, "sec-countdown", "down");
    expect(moved.ok).toBe(true);
    if (!moved.ok) return;
    expect(moved.site.sections.map((section) => section.type).slice(0, 3)).toEqual([
      "hero",
      "story",
      "countdown",
    ]);
    expect(moved.site.sections[2]?.sortOrder).toBe(2);
    expect(site.sections[1]?.type).toBe("countdown");

    const stuck = moveSection(site, "sec-hero", "up");
    expect(stuck.ok).toBe(true);
    if (stuck.ok) expect(stuck.site).toBe(site);

    const invalid = updateSectionContent(site, hero.id, { title: "x".repeat(400) });
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) expect(invalid.site).toBe(site);

    const renamed = updateSectionContent(site, hero.id, {
      ...hero.content,
      title: "Claire et Julien",
    });
    expect(renamed.ok).toBe(true);
    if (!renamed.ok) return;
    const nextHero = renamed.site.sections.find((section) => section.type === "hero");
    expect(nextHero?.content).toMatchObject({ title: "Claire et Julien" });
    expect(site.sections.find((section) => section.type === "hero")?.content).toMatchObject({
      title: "Claire & Julien",
    });
  });

  it("rejects a theme that is not a 6-digit hex color", () => {
    const site = createSampleSite("fixture-wedding");
    const result = applyTheme(site, { ...site.presentation.theme, accent: "red" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.site.presentation.theme.accent).toBe(site.presentation.theme.accent);
  });

  it("only allows https urls without credentials", () => {
    expect(safeHttpsUrl("https://example.com/liste")).toBe("https://example.com/liste");
    expect(safeHttpsUrl(" http://example.com ")).toBeNull();
    expect(safeHttpsUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpsUrl("https://user:pass@example.com")).toBeNull();
    expect(safeHttpsUrl("")).toBeNull();
  });

  it("counts down on UTC calendar dates", () => {
    const now = new Date("2027-06-10T23:30:00Z");
    expect(daysUntil("2027-06-12", now)).toBe(2);
    expect(countdownLabel(2)).toBe("Dans 2 jours");
    expect(daysUntil("", now)).toBeNull();
    expect(countdownLabel(null)).toMatch(/Ajoutez une date/);
  });
});

describe("memory website repository", () => {
  it("returns the sample, an empty draft, or a load error", async () => {
    const sample = await createMemoryWebsiteRepository("sample").getSite("fixture-wedding");
    expect(sample?.title).toBe("Claire & Julien");
    expect(sample?.sections.every((section) => section.enabled)).toBe(true);

    const empty = await createMemoryWebsiteRepository("empty").getSite("fixture-wedding");
    expect(empty?.sections.every((section) => section.enabled === false)).toBe(true);

    await expect(createMemoryWebsiteRepository("error").getSite("fixture-wedding")).rejects.toBeInstanceOf(
      WebsiteLoadError,
    );
  });

  it("does not pretend that save is connected", async () => {
    const site = createSampleSite("fixture-wedding");
    await expect(createMemoryWebsiteRepository("sample").saveSite(site)).rejects.toBeInstanceOf(
      WebsitePersistenceError,
    );
  });
});
