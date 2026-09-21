/**
 * Website builder domain.
 * Content (sections) is stored apart from presentation (template + theme).
 * Switching templates must never drop, rewrite, or reorder section content.
 */

export const TEMPLATE_IDS = [
  "editorial",
  "modern",
  "romantic",
  "minimal",
  "garden",
  "luxury",
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const SECTION_TYPES = [
  "hero",
  "countdown",
  "story",
  "events",
  "venue",
  "gallery",
  "dress_code",
  "faq",
  "registry",
  "rsvp",
  "footer",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export const SITE_STATUSES = ["draft", "published"] as const;

export type SiteStatus = (typeof SITE_STATUSES)[number];

export type FontChoice = "serif" | "sans";

export type ThemeTokens = {
  background: string;
  surface: string;
  ink: string;
  muted: string;
  accent: string;
  accentSecondary: string;
  displayFont: FontChoice;
  bodyFont: FontChoice;
};

export type HeroContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  dateLabel: string;
  imageUrl: string;
  imageAlt: string;
};

export type CountdownContent = {
  heading: string;
  targetDate: string;
  message: string;
};

export type StoryContent = {
  heading: string;
  body: string;
};

export type EventItem = {
  id: string;
  title: string;
  dateTimeLabel: string;
  location: string;
  description: string;
};

export type EventsContent = {
  heading: string;
  items: EventItem[];
};

export type VenueContent = {
  heading: string;
  name: string;
  address: string;
  note: string;
};

export type GalleryImage = {
  id: string;
  imageUrl: string;
  alt: string;
};

export type GalleryContent = {
  heading: string;
  images: GalleryImage[];
};

export type DressCodeContent = {
  heading: string;
  description: string;
  palette: string[];
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type FaqContent = {
  heading: string;
  items: FaqItem[];
};

export type RegistryLink = {
  id: string;
  label: string;
  url: string;
};

export type RegistryContent = {
  heading: string;
  intro: string;
  links: RegistryLink[];
};

export type RsvpContent = {
  heading: string;
  intro: string;
  deadlineLabel: string;
  buttonLabel: string;
};

export type FooterContent = {
  names: string;
  dateLabel: string;
  note: string;
  showMonogram: boolean;
};

export type ContentByType = {
  hero: HeroContent;
  countdown: CountdownContent;
  story: StoryContent;
  events: EventsContent;
  venue: VenueContent;
  gallery: GalleryContent;
  dress_code: DressCodeContent;
  faq: FaqContent;
  registry: RegistryContent;
  rsvp: RsvpContent;
  footer: FooterContent;
};

export type SectionContent = ContentByType[SectionType];

export type SiteSection = {
  [K in SectionType]: {
    id: string;
    type: K;
    enabled: boolean;
    sortOrder: number;
    content: ContentByType[K];
  };
}[SectionType];

export type SitePresentation = {
  templateId: TemplateId;
  theme: ThemeTokens;
};

export type SiteDocument = {
  id: string;
  weddingId: string;
  slug: string;
  title: string;
  status: SiteStatus;
  isPrivate: boolean;
  presentation: SitePresentation;
  sections: SiteSection[];
};

export type HeroLayout = "centered" | "split" | "overlay" | "plain";

export type TemplateDefinition = {
  id: TemplateId;
  label: string;
  description: string;
  heroLayout: HeroLayout;
  align: "left" | "center";
  italicDisplay: boolean;
  uppercaseEyebrow: boolean;
  tracking: "normal" | "wide" | "luxury";
  showRules: boolean;
  defaultTheme: ThemeTokens;
};
