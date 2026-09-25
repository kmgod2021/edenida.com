import Link from "next/link";
import type { ReactNode } from "react";

import { signOutAction } from "@/lib/auth/actions";

import { focusRing } from "./classes";

export function WorkspaceEntry({
  children,
  email = null,
}: {
  children: ReactNode;
  email?: string | null;
}) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-1 flex-col px-6 py-12">
      <header className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className={`font-display text-3xl text-ink ${focusRing}`}
        >
          Edenida
        </Link>
        <div className="flex items-center gap-3 text-sm">
          {email ? (
            <>
              <p className="text-ink-muted">
                Session :{" "}
                <strong className="text-ink">connecté ({email})</strong>
              </p>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className={`rounded-md border border-line px-3 py-1.5 text-ink transition hover:bg-bg-elevated ${focusRing}`}
                >
                  Déconnexion
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className={`rounded-md border border-line px-3 py-1.5 text-ink transition hover:bg-bg-elevated ${focusRing}`}
            >
              Connexion
            </Link>
          )}
        </div>
      </header>
      <div className="mt-12">{children}</div>
    </div>
  );
}
