import { WEDDING_ROLE_LABELS } from "../domain/labels";
import type { WeddingMember } from "../domain/types";

export function WeddingMembers({
  members,
  viewerUserId,
  profileNames,
  partnerDisplayName,
}: {
  members: readonly WeddingMember[];
  viewerUserId: string;
  profileNames: Readonly<Record<string, string>>;
  partnerDisplayName: string | null;
}) {
  return (
    <section aria-labelledby="members-heading" className="mt-12">
      <h2 id="members-heading" className="font-display text-3xl text-ink">
        Membres
      </h2>
      <ul aria-label="Membres" className="mt-4">
        {members.map((member) => {
          const name = profileNames[member.userId] ?? "Membre";
          const you = member.userId === viewerUserId;
          return (
            <li
              key={member.id}
              className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line py-3 text-sm"
            >
              <span className="text-ink">
                {name}
                {you ? <span className="text-ink-muted"> · vous</span> : null}
              </span>
              <span className="text-ink-muted">
                {WEDDING_ROLE_LABELS[member.role]}
              </span>
            </li>
          );
        })}
      </ul>
      {partnerDisplayName ? (
        <p className="mt-4 text-sm leading-relaxed text-ink-muted">
          {partnerDisplayName} — partenaire indiqué, pas encore membre.
        </p>
      ) : (
        <p className="mt-4 text-sm text-ink-muted">
          Aucun partenaire indiqué. Vous pourrez l&apos;inviter plus tard.
        </p>
      )}
    </section>
  );
}
