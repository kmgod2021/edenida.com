import type { CSSProperties } from "react";
import type { FontChoice, ThemeTokens } from "@/features/website/domain/types";

export function fontStack(font: FontChoice): string {
  return font === "serif"
    ? "var(--font-display), Georgia, serif"
    : "var(--font-body), sans-serif";
}

export function themeStyle(theme: ThemeTokens): CSSProperties {
  return {
    backgroundColor: theme.background,
    color: theme.ink,
    fontFamily: fontStack(theme.bodyFont),
  };
}

export function displayStyle(theme: ThemeTokens): CSSProperties {
  return { fontFamily: fontStack(theme.displayFont), color: theme.ink };
}

export const fieldClass =
  "w-full rounded-md border border-line bg-bg-elevated px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent";

export const quietButtonClass =
  "rounded-md border border-line bg-bg-elevated px-3 py-2 text-sm text-ink transition hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40";

export const primaryButtonClass =
  "rounded-md bg-ink px-4 py-2 text-sm font-medium text-bg-elevated transition hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";
