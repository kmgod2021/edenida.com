import Link from "next/link";
import type { ReactNode } from "react";

import { focusRing } from "./classes";

export function WorkspaceEntry({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-1 flex-col px-6 py-12">
      <header>
        <Link
          href="/"
          className={`font-display text-3xl text-ink ${focusRing}`}
        >
          Edenida
        </Link>
      </header>
      <div className="mt-12">{children}</div>
    </div>
  );
}
