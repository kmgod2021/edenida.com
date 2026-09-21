import { isGuestDataError } from "@/features/guests/data/errors";
import { getGuestRepository } from "@/features/guests/data/get-repository";
import { firstParam, parseRouteContext } from "@/features/guests/domain/route-context";
import type { PublicRsvpView } from "@/features/guests/domain/types";
import { ErrorState } from "@/features/guests/ui/states";
import { PublicRsvpForm } from "@/features/guests/ui/public-rsvp-form";
import { PublicShell } from "@/features/guests/ui/workspace-frame";
import type { PublicPageProps } from "@/features/guests/pages/load";

type PublicOutcome =
  | { kind: "invalid"; message: string }
  | { kind: "ready"; view: PublicRsvpView }
  | { kind: "unavailable"; message: string };

export default async function PublicRsvpPage(props: PublicPageProps) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  const ctx = parseRouteContext(searchParams);
  const token = firstParam(searchParams.t) ?? "";
  const outcome = await loadPublicRsvp(slug, token, ctx);

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
    <PublicShell weddingTitle={outcome.view.weddingTitle}>
      <PublicRsvpForm slug={slug} token={token} view={outcome.view} ctx={ctx} />
    </PublicShell>
  );
}

async function loadPublicRsvp(
  slug: string,
  token: string,
  ctx: ReturnType<typeof parseRouteContext>,
): Promise<PublicOutcome> {
  try {
    const result = await getGuestRepository(ctx).getPublicRsvp(slug, token);
    if (!result.ok) return { kind: "invalid", message: result.message };
    return { kind: "ready", view: result.view };
  } catch (error) {
    if (!isGuestDataError(error)) throw error;
    return { kind: "unavailable", message: error.message };
  }
}
