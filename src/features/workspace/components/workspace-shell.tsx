import Link from "next/link";
import type { ReactNode } from "react";

import { focusRing, quietLinkClass } from "./classes";

export function WorkspaceShell({
  weddingTitle,
  nav,
  children,
}: {
  weddingTitle: string;
  nav: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <a
        href="#workspace-main"
        className={`sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-20 focus:bg-bg-elevated focus:px-3 focus:py-2 ${focusRing}`}
      >
        Aller au contenu
      </a>
      <header className="flex items-center justify-between gap-4 border-b border-line px-4 py-4 md:px-8">
        <Link href="/app" className={`font-display text-2xl text-ink ${focusRing}`}>
          Edenida
        </Link>
        <p className="truncate text-sm text-ink-muted">{weddingTitle}</p>
      </header>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {nav}
        <main
          id="workspace-main"
          className="mx-auto w-full min-w-0 max-w-3xl flex-1 px-4 py-8 md:px-10 md:py-12"
        >
          {children}
        </main>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-4 text-xs text-ink-muted md:px-8">
        <p>
          Aperçu enregistré dans ce navigateur. La sauvegarde sur votre compte
          sera branchée ensuite.
        </p>
        <Link href="/app/weddings/new" className={quietLinkClass}>
          Nouveau mariage
        </Link>
      </footer>
    </div>
  );
}
