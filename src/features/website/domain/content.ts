import { z } from "zod";
import type {
  ContentByType,
  DressCodeContent,
  EventItem,
  EventsContent,
  FaqContent,
  FaqItem,
  FooterContent,
  GalleryContent,
  GalleryImage,
  HeroContent,
  RegistryContent,
  RegistryLink,
  SectionContent,
  SectionType,
  StoryContent,
  VenueContent,
  CountdownContent,
  RsvpContent,
} from "@/features/website/domain/types";

const LIMIT = {
  short: 80,
  title: 120,
  medium: 280,
  long: 2000,
  url: 500,
  list: 8,
  faq: 12,
  gallery: 12,
} as const;

const text = (max: number) => z.string().max(max);
const optionalDate = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: "Date au format AAAA-MM-JJ, ou vide.",
  });

export const heroContentSchema = z.object({
  eyebrow: text(LIMIT.short),
  title: text(LIMIT.title),
  subtitle: text(LIMIT.medium),
  dateLabel: text(LIMIT.short),
  imageUrl: text(LIMIT.url),
  imageAlt: text(160),
});

export const countdownContentSchema = z.object({
  heading: text(LIMIT.title),
  targetDate: optionalDate,
  message: text(LIMIT.medium),
});

export const storyContentSchema = z.object({
  heading: text(LIMIT.title),
  body: text(LIMIT.long),
});

const eventItemSchema = z.object({
  id: z.string().trim().min(1).max(80),
  title: text(LIMIT.title),
  dateTimeLabel: text(LIMIT.short),
  location: text(LIMIT.title),
  description: text(LIMIT.medium),
});

export const eventsContentSchema = z.object({
  heading: text(LIMIT.title),
  items: z.array(eventItemSchema).max(LIMIT.list),
});

export const venueContentSchema = z.object({
  heading: text(LIMIT.title),
  name: text(LIMIT.title),
  address: text(LIMIT.medium),
  note: text(LIMIT.medium),
});

const galleryImageSchema = z.object({
  id: z.string().trim().min(1).max(80),
  imageUrl: text(LIMIT.url),
  alt: text(160),
});

export const galleryContentSchema = z.object({
  heading: text(LIMIT.title),
  images: z.array(galleryImageSchema).max(LIMIT.gallery),
});

export const dressCodeContentSchema = z.object({
  heading: text(LIMIT.title),
  description: text(LIMIT.long),
  palette: z.array(text(40)).max(LIMIT.list),
});

const faqItemSchema = z.object({
  id: z.string().trim().min(1).max(80),
  question: text(LIMIT.medium),
  answer: text(LIMIT.long),
});

export const faqContentSchema = z.object({
  heading: text(LIMIT.title),
  items: z.array(faqItemSchema).max(LIMIT.faq),
});

const registryLinkSchema = z.object({
  id: z.string().trim().min(1).max(80),
  label: text(LIMIT.title),
  url: text(LIMIT.url),
});

export const registryContentSchema = z.object({
  heading: text(LIMIT.title),
  intro: text(LIMIT.medium),
  links: z.array(registryLinkSchema).max(LIMIT.list),
});

export const rsvpContentSchema = z.object({
  heading: text(LIMIT.title),
  intro: text(LIMIT.medium),
  deadlineLabel: text(LIMIT.short),
  buttonLabel: text(LIMIT.short),
});

export const footerContentSchema = z.object({
  names: text(LIMIT.title),
  dateLabel: text(LIMIT.short),
  note: text(LIMIT.medium),
  showMonogram: z.boolean(),
});

export const contentSchemaByType = {
  hero: heroContentSchema,
  countdown: countdownContentSchema,
  story: storyContentSchema,
  events: eventsContentSchema,
  venue: venueContentSchema,
  gallery: galleryContentSchema,
  dress_code: dressCodeContentSchema,
  faq: faqContentSchema,
  registry: registryContentSchema,
  rsvp: rsvpContentSchema,
  footer: footerContentSchema,
} as const;

export function parseSectionContent<T extends SectionType>(type: T, content: unknown) {
  return contentSchemaByType[type].safeParse(content);
}

export function blankHero(): HeroContent {
  return { eyebrow: "", title: "", subtitle: "", dateLabel: "", imageUrl: "", imageAlt: "" };
}

export function blankCountdown(): CountdownContent {
  return { heading: "", targetDate: "", message: "" };
}

export function blankStory(): StoryContent {
  return { heading: "", body: "" };
}

export function blankEventItem(id: string): EventItem {
  return { id, title: "", dateTimeLabel: "", location: "", description: "" };
}

export function blankEvents(): EventsContent {
  return { heading: "", items: [] };
}

export function blankVenue(): VenueContent {
  return { heading: "", name: "", address: "", note: "" };
}

export function blankGalleryImage(id: string): GalleryImage {
  return { id, imageUrl: "", alt: "" };
}

export function blankGallery(): GalleryContent {
  return { heading: "", images: [] };
}

export function blankDressCode(): DressCodeContent {
  return { heading: "", description: "", palette: [] };
}

export function blankFaqItem(id: string): FaqItem {
  return { id, question: "", answer: "" };
}

export function blankFaq(): FaqContent {
  return { heading: "", items: [] };
}

export function blankRegistryLink(id: string): RegistryLink {
  return { id, label: "", url: "" };
}

export function blankRegistry(): RegistryContent {
  return { heading: "", intro: "", links: [] };
}

export function blankRsvp(): RsvpContent {
  return { heading: "", intro: "", deadlineLabel: "", buttonLabel: "" };
}

export function blankFooter(): FooterContent {
  return { names: "", dateLabel: "", note: "", showMonogram: false };
}

export function blankContent(type: SectionType): SectionContent {
  switch (type) {
    case "hero":
      return blankHero();
    case "countdown":
      return blankCountdown();
    case "story":
      return blankStory();
    case "events":
      return blankEvents();
    case "venue":
      return blankVenue();
    case "gallery":
      return blankGallery();
    case "dress_code":
      return blankDressCode();
    case "faq":
      return blankFaq();
    case "registry":
      return blankRegistry();
    case "rsvp":
      return blankRsvp();
    case "footer":
      return blankFooter();
    default: {
      const exhaustive: never = type;
      return exhaustive;
    }
  }
}

export function contentForType<T extends SectionType>(
  type: T,
  content: SectionContent,
): ContentByType[T] | null {
  const parsed = parseSectionContent(type, content);
  return parsed.success ? (parsed.data as ContentByType[T]) : null;
}
