import Link from "next/link";

import { WorkspaceEntry } from "./workspace-entry";
import { quietLinkClass } from "./classes";

export function WorkspaceNotFound() {
  return (
    <WorkspaceEntry>
      <h1 className="font-display text-4xl text-ink md:text-5xl">
        Ce mariage est introuvable
      </h1>
      <p className="mt-4 max-w-xl leading-relaxed text-ink-muted">
        Il n&apos;est pas dans cet aperçu, ou vous n&apos;y avez pas accès.
      </p>
      <Link href="/app" className={`${quietLinkClass} mt-8 inline-block`}>
        Retour à l&apos;espace
      </Link>
    </WorkspaceEntry>
  );
}
