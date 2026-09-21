import { cn } from "@/lib/utils";

export const fieldClassName =
  "w-full rounded-md border border-line bg-bg-elevated px-3 py-2.5 text-base text-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-sm";

export const labelClassName = "grid gap-1 text-sm text-ink";

export const primaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-medium text-bg-elevated transition hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export const quietButtonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-md px-2 py-2 text-sm text-ink-muted transition hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function tabClassName(selected: boolean): string {
  return cn(
    "min-h-11 flex-1 border-b-2 px-2 py-2 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:flex-none sm:px-4",
    selected ? "border-accent text-ink" : "border-transparent text-ink-muted hover:text-ink",
  );
}

export function filterClassName(selected: boolean): string {
  return cn(
    "min-h-11 px-1 py-2 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    selected
      ? "text-ink underline decoration-accent decoration-2 underline-offset-8"
      : "text-ink-muted hover:text-ink",
  );
}
