import { isGuestDataError } from "@/features/guests/data/errors";
import { getGuestRepository } from "@/features/guests/data/get-repository";
import { firstParam, parseRouteContext } from "@/features/guests/domain/route-context";
import type { RsvpConfirmation } from "@/features/guests/domain/types";
import { ErrorState } from "@/features/guests/ui/states";
import { RsvpConfirmationView } from "@/features/guests/ui/rsvp-confirmation";
import { PublicShell } from "@/features/guests/ui/workspace-frame";
import type { PublicPageProps } from "@/features/guests/pages/load";

type ConfirmationOutcome =
  | { kind: "invalid"; message: string }
  | {
      kind: "ready";
      weddingTitle: string;
      guestFirstName: string;
      confirmation: RsvpConfirmation | null;
    }
  | { kind: "unavailable"; message: string };

export default async function RsvpConfirmationPage(props: PublicPageProps) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  const ctx = parseRouteContext(searchParams);
  const token = firstParam(searchParams.t) ?? "";
  const outcome = await loadConfirmation(slug, token, ctx);

  if (outcome.kind === "unavailable") {
    return <ErrorState title="Formulaire indisponible" body={outcome.message} />;
  }
  if (outcome.kind === "invalid") {
    return (
      <PublicShell>
        <h1 className="font-display text-4xl text-ink">Invitation</h1>
        <p role="alert" className="mt-4 leading-relaxed text-ink-muted">
          {outcome.message}
        </p>
      </PublicShell>
    );
  }
  return (
    <PublicShell weddingTitle={outcome.weddingTitle}>
      <RsvpConfirmationView
        slug={slug}
        token={token}
        ctx={ctx}
        weddingTitle={outcome.weddingTitle}
        guestFirstName={outcome.guestFirstName}
        confirmation={outcome.confirmation}
      />
    </PublicShell>
  );
}

async function loadConfirmation(
  slug: string,
  token: string,
  ctx: ReturnType<typeof parseRouteContext>,
): Promise<ConfirmationOutcome> {
  try {
    const result = await getGuestRepository(ctx).getRsvpConfirmation(slug, token);
    if (!result.ok) return { kind: "invalid", message: result.message };
    return {
      kind: "ready",
      weddingTitle: result.weddingTitle,
      guestFirstName: result.guestFirstName,
      confirmation: result.confirmation,
    };
  } catch (error) {
    if (!isGuestDataError(error)) throw error;
    return { kind: "unavailable", message: error.message };
  }
}
