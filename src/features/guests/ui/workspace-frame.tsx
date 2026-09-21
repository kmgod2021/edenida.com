import Link from "next/link";
import type { ReactNode } from "react";

import { guestPaths, type RouteContext } from "@/features/guests/domain/route-context";
import type { WeddingGuestScope } from "@/features/guests/domain/types";

const linkClass = "border-b-2 px-3 py-2 text-sm transition";

export function WorkspaceFrame({
  wedding,
  ctx,
  current,
  notice,
  children,
}: {
  wedding: WeddingGuestScope;
  ctx: RouteContext;
  current: "guests" | "households" | "rsvp";
  notice: string | null;
  children: ReactNode;
}) {
  const paths = guestPaths(wedding.id, ctx);
  const items = [
    ["guests", "Invités", paths.list()],
    ["households", "Foyers", paths.households()],
    ["rsvp", "Réponses", paths.rsvp()],
  ] as const;

  return (
    <main className="mx-auto flex min-h-full w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-6">
      <header>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <Link href="/" className="font-display text-3xl text-ink">
            Edenida
          </Link>
          <p className="text-sm text-ink-muted">{wedding.title}</p>
        </div>
        <nav aria-label="Invités" className="mt-6 flex flex-wrap gap-1 border-b border-line">
          {items.map(([key, label, href]) => (
            <Link
              key={key}
              href={href}
              aria-current={current === key ? "page" : undefined}
              className={`${linkClass} ${
                current === key
                  ? "border-accent text-ink"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>
      {notice ? (
        <p role="status" className="mt-6 text-sm text-success">
          {notice}
        </p>
      ) : null}
      <div className="mt-8 animate-[fadeRise_700ms_ease-out]">{children}</div>
    </main>
  );
}

export function PublicShell({
  weddingTitle,
  children,
}: {
  weddingTitle?: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col px-4 py-10 sm:px-6">
      <p className="font-display text-3xl text-ink">Edenida</p>
      {weddingTitle ? <p className="mt-2 text-sm text-ink-muted">{weddingTitle}</p> : null}
      <div className="mt-8 animate-[fadeRise_700ms_ease-out]">{children}</div>
    </main>
  );
}
