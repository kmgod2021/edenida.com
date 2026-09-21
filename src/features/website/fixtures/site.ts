import { defaultSectionOrder } from "@/features/website/domain/registry";
import { assertSiteDocument } from "@/features/website/domain/schema";
import { getTemplate } from "@/features/website/domain/templates";
import type { SiteDocument, SiteSection } from "@/features/website/domain/types";
import { FIXTURE_WEDDING } from "@/features/website/fixtures/wedding";

function section<T extends SiteSection["type"]>(
  type: T,
  sortOrder: number,
  content: Extract<SiteSection, { type: T }>["content"],
): SiteSection {
  return {
    id: `sec-${type.replaceAll("_", "-")}`,
    type,
    enabled: true,
    sortOrder,
    content,
  } as SiteSection;
}

export function createSampleSite(weddingId: string): SiteDocument {
  const template = getTemplate("editorial");
  return assertSiteDocument({
    id: FIXTURE_WEDDING.siteId,
    weddingId,
    slug: FIXTURE_WEDDING.slug,
    title: FIXTURE_WEDDING.title,
    status: "draft",
    isPrivate: true,
    presentation: {
      templateId: template.id,
      theme: structuredClone(template.defaultTheme),
    },
    sections: [
      section("hero", 0, {
        eyebrow: "Nous nous marions",
        title: FIXTURE_WEDDING.title,
        subtitle: "Une journée dans les Laurentides, avec les gens que nous aimons.",
        dateLabel: FIXTURE_WEDDING.dateLabel,
        imageUrl: "",
        imageAlt: "Forêt de bouleaux au Domaine des Érables",
      }),
      section("countdown", 1, {
        heading: "Le compte à rebours",
        targetDate: FIXTURE_WEDDING.weddingDate,
        message: "Réservez la date — le détail des festivités suit.",
      }),
      section("story", 2, {
        heading: "Notre histoire",
        body: "Claire et Julien se sont rencontrés un jeudi de pluie à Montréal, autour d'un café trop long. Des années plus tard, ils vous invitent à célébrer la suite, au calme, sous les érables.",
      }),
      section("events", 3, {
        heading: "La journée",
        items: [
          {
            id: "evt-ceremony",
            title: "Cérémonie",
            dateTimeLabel: "15 h",
            location: "Chapelle du domaine",
            description: "Une cérémonie courte, assise.",
          },
          {
            id: "evt-cocktail",
            title: "Cocktail",
            dateTimeLabel: "16 h 30",
            location: "Jardin",
            description: "Verres et ombre des arbres.",
          },
          {
            id: "evt-dinner",
            title: "Dîner",
            dateTimeLabel: "18 h 30",
            location: "Orangerie",
            description: "Table unique, discours brefs.",
          },
        ],
      }),
      section("venue", 4, {
        heading: "Le lieu",
        name: FIXTURE_WEDDING.venueName,
        address: FIXTURE_WEDDING.venueAddress,
        note: "Stationnement sur place. Navette depuis le village en soirée.",
      }),
      section("gallery", 5, {
        heading: "Galerie",
        images: [
          { id: "img-1", imageUrl: "", alt: "Allée de bouleaux" },
          { id: "img-2", imageUrl: "", alt: "Table du dîner" },
          { id: "img-3", imageUrl: "", alt: "Lumière du soir" },
        ],
      }),
      section("dress_code", 6, {
        heading: "Tenue",
        description: "Tenue de jardin. Confortable pour l'herbe, assez habillée pour le dîner.",
        palette: ["Ivoire", "Sauge", "Champagne"],
      }),
      section("faq", 7, {
        heading: "Questions",
        items: [
          {
            id: "faq-children",
            question: "Les enfants sont-ils invités ?",
            answer: "La journée est pensée pour les adultes. Écrivez-nous si vous avez besoin d'une exception.",
          },
          {
            id: "faq-stay",
            question: "Où dormir ?",
            answer: "Un bloc de chambres est réservé au village. Le lien suivra dans votre invitation.",
          },
        ],
      }),
      section("registry", 8, {
        heading: "Liste de mariage",
        intro: "Votre présence compte plus que tout. Si vous souhaitez offrir quelque chose :",
        links: [
          {
            id: "reg-home",
            label: "Liste maison",
            url: "https://example.com/claire-et-julien",
          },
        ],
      }),
      section("rsvp", 9, {
        heading: "RSVP",
        intro: "Merci de nous répondre avant le 1er mai. Un lien personnel arrivera avec votre invitation.",
        deadlineLabel: "Avant le 1er mai 2027",
        buttonLabel: "Répondre",
      }),
      section("footer", 10, {
        names: FIXTURE_WEDDING.title,
        dateLabel: FIXTURE_WEDDING.dateLabel,
        note: "Avec amour",
        showMonogram: true,
      }),
    ],
  });
}

export function createEmptySite(weddingId: string): SiteDocument {
  const template = getTemplate("editorial");
  return assertSiteDocument({
    id: `site-${weddingId}`,
    weddingId,
    slug: "brouillon",
    title: "Nouveau site",
    status: "draft",
    isPrivate: true,
    presentation: {
      templateId: template.id,
      theme: structuredClone(template.defaultTheme),
    },
    sections: defaultSectionOrder(),
  });
}
