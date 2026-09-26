import Link from "next/link";

import { WorkspaceEntry } from "./workspace-entry";
import { quietLinkClass } from "./classes";

export function WorkspaceNotFound({
  email = null,
}: {
  email?: string | null;
}) {
  return (
    <WorkspaceEntry email={email}>
      <h1 className="font-display text-4xl text-ink md:text-5xl">
        Ce mariage est introuvable
      </h1>
      <p className="mt-4 max-w-xl leading-relaxed text-ink-muted">
        Il n&apos;existe pas dans votre espace, ou vous n&apos;y avez pas accès.
      </p>
      <Link href="/app" className={`${quietLinkClass} mt-8 inline-block`}>
        Retour à l&apos;espace
      </Link>
    </WorkspaceEntry>
  );
}
