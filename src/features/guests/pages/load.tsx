import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { isGuestDataError } from "@/features/guests/data/errors";
import { getGuestRepository } from "@/features/guests/data/get-repository";
import {
  firstParam,
  noticeMessage,
  parseRouteContext,
  type RouteContext,
} from "@/features/guests/domain/route-context";
import { ErrorState } from "@/features/guests/ui/states";
import { WorkspaceFrame } from "@/features/guests/ui/workspace-frame";
import type { WeddingGuestScope } from "@/features/guests/domain/types";
import type { GuestRepository } from "@/features/guests/data/repository";

export type WeddingPageProps = {
  params: Promise<{ weddingId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export type PublicPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type Loaded =
  | { ok: true; repo: GuestRepository; wedding: WeddingGuestScope; ctx: RouteContext; notice: string | null }
  | { ok: false; body: string };

export async function loadWeddingPage(
  props: WeddingPageProps,
): Promise<Loaded | "missing"> {
  const { weddingId } = await props.params;
  const searchParams = await props.searchParams;
  const ctx = parseRouteContext(searchParams);
  const notice = noticeMessage(firstParam(searchParams.notice));
  try {
    const repo = getGuestRepository(ctx);
    const wedding = await repo.getWedding(weddingId);
    if (!wedding) return "missing";
    return { ok: true, repo, wedding, ctx, notice };
  } catch (error) {
    if (isGuestDataError(error)) return { ok: false, body: error.message };
    throw error;
  }
}

export function missingWedding(): never {
  return notFound();
}

export function WeddingError({ body }: { body: string }) {
  return (
    <ErrorState
      title="Impossible de charger les invités"
      body={body}
    />
  );
}

export function WeddingShell({
  loaded,
  current,
  children,
}: {
  loaded: Extract<Loaded, { ok: true }>;
  current: "guests" | "households" | "rsvp";
  children: ReactNode;
}) {
  return (
    <WorkspaceFrame
      wedding={loaded.wedding}
      ctx={loaded.ctx}
      current={current}
      notice={loaded.notice}
    >
      {children}
    </WorkspaceFrame>
  );
}
