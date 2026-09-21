import type { TemplateDefinition, TemplateId, ThemeTokens } from "@/features/website/domain/types";

const editorialTheme: ThemeTokens = {
  background: "#f7f1ea",
  surface: "#fffaf5",
  ink: "#2a211c",
  muted: "#6b5d54",
  accent: "#8c4a3a",
  accentSecondary: "#7a8f7a",
  displayFont: "serif",
  bodyFont: "sans",
};

const modernTheme: ThemeTokens = {
  background: "#f4f4f2",
  surface: "#ffffff",
  ink: "#1c1c1a",
  muted: "#5c5c56",
  accent: "#1c1c1a",
  accentSecondary: "#8d6a5a",
  displayFont: "sans",
  bodyFont: "sans",
};

const romanticTheme: ThemeTokens = {
  background: "#fbf6f4",
  surface: "#fffdfb",
  ink: "#3a2a2c",
  muted: "#7a6166",
  accent: "#a85d6a",
  accentSecondary: "#d7b4a8",
  displayFont: "serif",
  bodyFont: "serif",
};

const minimalTheme: ThemeTokens = {
  background: "#fafafa",
  surface: "#ffffff",
  ink: "#1a1a1a",
  muted: "#6f6f6f",
  accent: "#1a1a1a",
  accentSecondary: "#b9b9b9",
  displayFont: "sans",
  bodyFont: "sans",
};

const gardenTheme: ThemeTokens = {
  background: "#f3f6f1",
  surface: "#fbfcf8",
  ink: "#243026",
  muted: "#5d6b5e",
  accent: "#5e7a62",
  accentSecondary: "#c4a574",
  displayFont: "serif",
  bodyFont: "sans",
};

const luxuryTheme: ThemeTokens = {
  background: "#1c1714",
  surface: "#261f1b",
  ink: "#f6f1e8",
  muted: "#c7b8a8",
  accent: "#c4a574",
  accentSecondary: "#8c7352",
  displayFont: "serif",
  bodyFont: "serif",
};

export const TEMPLATES: readonly TemplateDefinition[] = [
  {
    id: "editorial",
    label: "Éditorial",
    description: "Serif centré, beaucoup d'air",
    heroLayout: "centered",
    align: "center",
    italicDisplay: false,
    uppercaseEyebrow: false,
    tracking: "normal",
    showRules: true,
    defaultTheme: editorialTheme,
  },
  {
    id: "modern",
    label: "Moderne",
    description: "Grille, sans, contrasté",
    heroLayout: "split",
    align: "left",
    italicDisplay: false,
    uppercaseEyebrow: true,
    tracking: "wide",
    showRules: false,
    defaultTheme: modernTheme,
  },
  {
    id: "romantic",
    label: "Romantique",
    description: "Italique, blush, ornement",
    heroLayout: "centered",
    align: "center",
    italicDisplay: true,
    uppercaseEyebrow: false,
    tracking: "normal",
    showRules: true,
    defaultTheme: romanticTheme,
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "Aligné à gauche, silencieux",
    heroLayout: "plain",
    align: "left",
    italicDisplay: false,
    uppercaseEyebrow: true,
    tracking: "wide",
    showRules: false,
    defaultTheme: minimalTheme,
  },
  {
    id: "garden",
    label: "Jardin",
    description: "Image pleine, sauge",
    heroLayout: "overlay",
    align: "left",
    italicDisplay: false,
    uppercaseEyebrow: false,
    tracking: "normal",
    showRules: false,
    defaultTheme: gardenTheme,
  },
  {
    id: "luxury",
    label: "Luxe",
    description: "Nuit, or, capitales",
    heroLayout: "centered",
    align: "center",
    italicDisplay: false,
    uppercaseEyebrow: true,
    tracking: "luxury",
    showRules: true,
    defaultTheme: luxuryTheme,
  },
];

const templateMap = new Map(TEMPLATES.map((template) => [template.id, template]));

export function isTemplateId(value: string): value is TemplateId {
  return templateMap.has(value as TemplateId);
}

export function getTemplate(id: TemplateId): TemplateDefinition {
  const template = templateMap.get(id);
  if (!template) {
    throw new Error(`Unknown template: ${id}`);
  }
  return template;
}
