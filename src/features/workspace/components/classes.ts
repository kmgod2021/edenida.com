export const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export const inputClass = `w-full rounded-md border border-line bg-bg-elevated px-3 py-3 text-ink outline-none ring-accent focus:ring-2 ${focusRing}`;

export const primaryButtonClass = `rounded-md bg-ink px-5 py-3 text-sm font-medium text-bg-elevated transition hover:bg-ink/90 disabled:opacity-60 ${focusRing}`;

export const accentLinkClass = `inline-flex rounded-md bg-accent px-5 py-3 text-sm font-medium text-bg-elevated transition hover:brightness-95 ${focusRing}`;

export const quietLinkClass = `text-sm text-ink-muted underline-offset-4 transition hover:text-ink hover:underline ${focusRing}`;
