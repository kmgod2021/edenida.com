import { parseSectionContent } from "@/features/website/domain/content";
import { getTemplate } from "@/features/website/domain/templates";
import type {
  SectionContent,
  SiteDocument,
  SiteSection,
  TemplateId,
  ThemeTokens,
} from "@/features/website/domain/types";
import { themeSchema } from "@/features/website/domain/schema";

export type EditResult =
  | { ok: true; site: SiteDocument }
  | { ok: false; site: SiteDocument; message: string };

function ok(site: SiteDocument): EditResult {
  return { ok: true, site };
}

function fail(site: SiteDocument, message: string): EditResult {
  return { ok: false, site, message };
}

function withSort(sections: SiteSection[]): SiteSection[] {
  return sections.map((section, sortOrder) => ({ ...section, sortOrder }));
}

export function setSectionEnabled(
  site: SiteDocument,
  sectionId: string,
  enabled: boolean,
): EditResult {
  const index = site.sections.findIndex((section) => section.id === sectionId);
  if (index < 0) return fail(site, "Section introuvable.");

  const sections = site.sections.map((section, sectionIndex) =>
    sectionIndex === index ? { ...section, enabled } : section,
  );
  return ok({ ...site, sections });
}

export function moveSection(
  site: SiteDocument,
  sectionId: string,
  direction: "up" | "down",
): EditResult {
  const index = site.sections.findIndex((section) => section.id === sectionId);
  if (index < 0) return fail(site, "Section introuvable.");

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= site.sections.length) return ok(site);

  const sections = site.sections.slice();
  const current = sections[index];
  const neighbor = sections[target];
  if (!current || !neighbor) return fail(site, "Section introuvable.");
  sections[index] = neighbor;
  sections[target] = current;
  return ok({ ...site, sections: withSort(sections) });
}

export function updateSectionContent(
  site: SiteDocument,
  sectionId: string,
  content: unknown,
): EditResult {
  const index = site.sections.findIndex((section) => section.id === sectionId);
  const current = index >= 0 ? site.sections[index] : undefined;
  if (!current) return fail(site, "Section introuvable.");

  const parsed = parseSectionContent(current.type, content);
  if (!parsed.success) {
    return fail(site, parsed.error.issues[0]?.message ?? "Contenu invalide.");
  }

  const sections = site.sections.slice();
  sections[index] = {
    ...current,
    content: parsed.data as SectionContent,
  } as SiteSection;
  return ok({ ...site, sections });
}

/**
 * Replaces presentation only. Section ids, types, flags, order, and content
 * stay deeply equal to the input.
 */
export function switchTemplate(site: SiteDocument, templateId: TemplateId): SiteDocument {
  const template = getTemplate(templateId);
  return {
    ...site,
    presentation: {
      templateId: template.id,
      theme: structuredClone(template.defaultTheme),
    },
    sections: site.sections.map((section) => ({
      ...section,
      content: structuredClone(section.content),
    })) as SiteDocument["sections"],
  };
}

export function applyTheme(site: SiteDocument, theme: unknown): EditResult {
  const parsed = themeSchema.safeParse(theme);
  if (!parsed.success) {
    return fail(site, parsed.error.issues[0]?.message ?? "Thème invalide.");
  }
  return ok({
    ...site,
    presentation: {
      ...site.presentation,
      theme: parsed.data satisfies ThemeTokens,
    },
  });
}

export function enabledSections(site: SiteDocument): SiteSection[] {
  return site.sections
    .filter((section) => section.enabled)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
