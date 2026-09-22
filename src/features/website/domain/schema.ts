import { z } from "zod";
import { contentSchemaByType } from "@/features/website/domain/content";
import { TEMPLATE_IDS } from "@/features/website/domain/types";
import type { SiteDocument, SiteSection, SectionType } from "@/features/website/domain/types";

const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Couleur hexadécimale #rrggbb.");

export const themeSchema = z.object({
  background: hexColor,
  surface: hexColor,
  ink: hexColor,
  muted: hexColor,
  accent: hexColor,
  accentSecondary: hexColor,
  displayFont: z.enum(["serif", "sans"]),
  bodyFont: z.enum(["serif", "sans"]),
});

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug en minuscules, chiffres et tirets.");

function sectionSchema<T extends SectionType>(type: T) {
  return z.object({
    id: z.string().trim().min(1).max(80),
    type: z.literal(type),
    enabled: z.boolean(),
    sortOrder: z.number().int().nonnegative(),
    content: contentSchemaByType[type],
  });
}

export const siteSectionSchema = z.discriminatedUnion("type", [
  sectionSchema("hero"),
  sectionSchema("countdown"),
  sectionSchema("story"),
  sectionSchema("events"),
  sectionSchema("venue"),
  sectionSchema("gallery"),
  sectionSchema("dress_code"),
  sectionSchema("faq"),
  sectionSchema("registry"),
  sectionSchema("rsvp"),
  sectionSchema("footer"),
]);

export const siteDocumentSchema = z
  .object({
    id: z.string().trim().min(1).max(80),
    weddingId: z.string().trim().min(1).max(80),
    slug: slugSchema,
    title: z.string().trim().min(1).max(120),
    status: z.enum(["draft", "published"]),
    isPrivate: z.boolean(),
    presentation: z.object({
      templateId: z.enum(TEMPLATE_IDS),
      theme: themeSchema,
    }),
    sections: z.array(siteSectionSchema).max(11),
  })
  .superRefine((site, ctx) => {
    const ids = new Set<string>();
    const types = new Set<string>();
    for (const [index, section] of site.sections.entries()) {
      if (ids.has(section.id)) {
        ctx.addIssue({
          code: "custom",
          path: ["sections", index, "id"],
          message: "Identifiant de section déjà utilisé.",
        });
      }
      ids.add(section.id);
      if (types.has(section.type)) {
        ctx.addIssue({
          code: "custom",
          path: ["sections", index, "type"],
          message: "Une seule section de chaque type.",
        });
      }
      types.add(section.type);
    }
  });

export function parseSiteDocument(input: unknown) {
  return siteDocumentSchema.safeParse(input);
}

export function assertSiteDocument(input: unknown): SiteDocument {
  return siteDocumentSchema.parse(input) as SiteDocument;
}

export function assertSiteSection(input: unknown): SiteSection {
  return siteSectionSchema.parse(input) as SiteSection;
}
