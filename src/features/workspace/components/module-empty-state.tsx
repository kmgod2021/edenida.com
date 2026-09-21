import Link from "next/link";

import { focusRing } from "./classes";

export function ModuleEmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <section className="max-w-xl">
      <h1 className="font-display text-4xl text-ink md:text-5xl">{title}</h1>
      <p className="mt-4 text-base leading-relaxed text-ink-muted">{description}</p>
      <Link
        href={actionHref}
        className={`mt-8 inline-flex rounded-md border border-line bg-bg-elevated px-5 py-3 text-sm font-medium text-ink transition hover:bg-background ${focusRing}`}
      >
        {actionLabel}
      </Link>
    </section>
  );
}
