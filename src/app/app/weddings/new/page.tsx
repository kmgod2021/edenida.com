import Link from "next/link";

import { CreateWeddingForm } from "@/features/workspace/components/create-wedding-form";
import { quietLinkClass } from "@/features/workspace/components/classes";
import { WorkspaceEntry } from "@/features/workspace/components/workspace-entry";
import { createWeddingAction } from "@/features/workspace/server/actions";

export const metadata = {
  title: "Créer le mariage",
};

export default function CreateWeddingPage() {
  return (
    <WorkspaceEntry>
      <Link href="/app" className={quietLinkClass}>
        Retour
      </Link>
      <h1 className="mt-6 font-display text-5xl text-ink">Créer le mariage</h1>
      <p className="mt-3 max-w-xl leading-relaxed text-ink-muted">
        Un titre suffit. La date peut attendre. Vous serez organisateur de cet
        espace.
      </p>
      <CreateWeddingForm action={createWeddingAction} />
    </WorkspaceEntry>
  );
}
