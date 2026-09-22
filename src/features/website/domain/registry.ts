import {
  blankContent,
  blankEventItem,
  blankFaqItem,
  blankGalleryImage,
  blankRegistryLink,
} from "@/features/website/domain/content";
import type {
  SectionType,
  SiteSection,
} from "@/features/website/domain/types";
import { SECTION_TYPES } from "@/features/website/domain/types";

export type ScalarFieldKind = "text" | "textarea" | "url" | "date";

export type ScalarField = {
  kind: ScalarFieldKind;
  key: string;
  label: string;
  maxLength: number;
};

export type ObjectListField = {
  kind: "objects";
  key: string;
  label: string;
  addLabel: string;
  itemLabel: string;
  maxItems: number;
  fields: ScalarField[];
  createItem: () => Record<string, string>;
};

export type StringListField = {
  kind: "strings";
  key: string;
  label: string;
  addLabel: string;
  itemLabel: string;
  maxLength: number;
  maxItems: number;
};

export type BooleanField = {
  kind: "boolean";
  key: string;
  label: string;
};

export type BlockListField = ObjectListField | StringListField;

export type BlockDefinition = {
  type: SectionType;
  label: string;
  description: string;
  fields: ScalarField[];
  list?: BlockListField;
  toggle?: BooleanField;
};

const text = (
  key: string,
  label: string,
  maxLength: number,
  kind: ScalarFieldKind = "text",
): ScalarField => ({ kind, key, label, maxLength });

let itemSeq = 0;

export function createItemId(prefix: string): string {
  itemSeq += 1;
  const random =
    globalThis.crypto?.randomUUID?.() ?? `fallback-${itemSeq.toString(36)}`;
  return `${prefix}-${random}`;
}

export const BLOCKS: readonly BlockDefinition[] = [
  {
    type: "hero",
    label: "Ouverture",
    description: "Noms, date et image d'accueil",
    fields: [
      text("eyebrow", "Sur-titre", 80),
      text("title", "Titre", 120),
      text("subtitle", "Sous-titre", 280, "textarea"),
      text("dateLabel", "Date affichée", 80),
      text("imageUrl", "Photo (https)", 500, "url"),
      text("imageAlt", "Texte alternatif", 160),
    ],
  },
  {
    type: "countdown",
    label: "Compte à rebours",
    description: "Jours restants avant la date",
    fields: [
      text("heading", "Titre", 120),
      text("targetDate", "Date cible", 10, "date"),
      text("message", "Message", 280, "textarea"),
    ],
  },
  {
    type: "story",
    label: "Histoire",
    description: "Votre récit",
    fields: [
      text("heading", "Titre", 120),
      text("body", "Texte", 2000, "textarea"),
    ],
  },
  {
    type: "events",
    label: "Événements",
    description: "Cérémonie, cocktail, dîner",
    fields: [text("heading", "Titre", 120)],
    list: {
      kind: "objects",
      key: "items",
      label: "Moments",
      addLabel: "Ajouter un moment",
      itemLabel: "Moment",
      maxItems: 8,
      fields: [
        text("title", "Titre", 120),
        text("dateTimeLabel", "Quand", 80),
        text("location", "Lieu", 120),
        text("description", "Détail", 280, "textarea"),
      ],
      createItem: () => blankEventItem(createItemId("event")),
    },
  },
  {
    type: "venue",
    label: "Lieu",
    description: "Nom et adresse",
    fields: [
      text("heading", "Titre", 120),
      text("name", "Nom du lieu", 120),
      text("address", "Adresse", 280, "textarea"),
      text("note", "Note", 280, "textarea"),
    ],
  },
  {
    type: "gallery",
    label: "Galerie",
    description: "Photos légendées",
    fields: [text("heading", "Titre", 120)],
    list: {
      kind: "objects",
      key: "images",
      label: "Photos",
      addLabel: "Ajouter une photo",
      itemLabel: "Photo",
      maxItems: 12,
      fields: [
        text("imageUrl", "Photo (https)", 500, "url"),
        text("alt", "Texte alternatif", 160),
      ],
      createItem: () => blankGalleryImage(createItemId("image")),
    },
  },
  {
    type: "dress_code",
    label: "Tenue",
    description: "Dress code et couleurs",
    fields: [
      text("heading", "Titre", 120),
      text("description", "Description", 2000, "textarea"),
    ],
    list: {
      kind: "strings",
      key: "palette",
      label: "Couleurs",
      addLabel: "Ajouter une couleur",
      itemLabel: "Couleur",
      maxLength: 40,
      maxItems: 8,
    },
  },
  {
    type: "faq",
    label: "Questions",
    description: "Réponses aux invités",
    fields: [text("heading", "Titre", 120)],
    list: {
      kind: "objects",
      key: "items",
      label: "Questions",
      addLabel: "Ajouter une question",
      itemLabel: "Question",
      maxItems: 12,
      fields: [
        text("question", "Question", 280),
        text("answer", "Réponse", 2000, "textarea"),
      ],
      createItem: () => blankFaqItem(createItemId("faq")),
    },
  },
  {
    type: "registry",
    label: "Liste de mariage",
    description: "Liens vers vos listes",
    fields: [
      text("heading", "Titre", 120),
      text("intro", "Introduction", 280, "textarea"),
    ],
    list: {
      kind: "objects",
      key: "links",
      label: "Liens",
      addLabel: "Ajouter un lien",
      itemLabel: "Lien",
      maxItems: 8,
      fields: [
        text("label", "Libellé", 120),
        text("url", "URL https", 500, "url"),
      ],
      createItem: () => blankRegistryLink(createItemId("link")),
    },
  },
  {
    type: "rsvp",
    label: "RSVP",
    description: "Texte d'invitation à répondre",
    fields: [
      text("heading", "Titre", 120),
      text("intro", "Texte", 280, "textarea"),
      text("deadlineLabel", "Date limite", 80),
      text("buttonLabel", "Libellé du bouton", 80),
    ],
  },
  {
    type: "footer",
    label: "Pied de page",
    description: "Signature du site",
    fields: [
      text("names", "Noms", 120),
      text("dateLabel", "Date", 80),
      text("note", "Note", 280, "textarea"),
    ],
    toggle: {
      kind: "boolean",
      key: "showMonogram",
      label: "Afficher le monogramme",
    },
  },
];

const blockMap = new Map(BLOCKS.map((block) => [block.type, block]));

export function getBlock(type: SectionType): BlockDefinition {
  const block = blockMap.get(type);
  if (!block) throw new Error(`Unknown block: ${type}`);
  return block;
}

export function assertRegistryCoversCatalog(): void {
  const types = new Set(BLOCKS.map((block) => block.type));
  for (const type of SECTION_TYPES) {
    if (!types.has(type)) {
      throw new Error(`Block registry missing ${type}`);
    }
  }
}

export function createSection(type: SectionType, sortOrder: number, enabled = false): SiteSection {
  const content = blankContent(type);
  return {
    id: `sec-${type.replaceAll("_", "-")}`,
    type,
    enabled,
    sortOrder,
    content,
  } as SiteSection;
}

export function defaultSectionOrder(): SiteSection[] {
  return SECTION_TYPES.map((type, index) => createSection(type, index, false));
}

