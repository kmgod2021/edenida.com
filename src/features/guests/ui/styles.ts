import { cn } from "@/lib/utils";

export const fieldClass =
  "w-full rounded-md border border-line bg-bg-elevated px-3 py-2 text-ink outline-none ring-accent focus:ring-2";

export const buttonClass =
  "rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-bg-elevated transition hover:bg-ink/90 disabled:opacity-60";

export const secondaryButtonClass =
  "rounded-md border border-line bg-bg-elevated px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-background";

export function cx(...parts: Array<string | false | null | undefined>) {
  return cn(...parts);
}
