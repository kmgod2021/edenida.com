import type { Metadata } from "next";
import type { ReactNode } from "react";
import { z } from "zod";

import { WeddingProvider } from "@/features/workspace/components/wedding-provider";
import { WorkspaceNav } from "@/features/workspace/components/workspace-nav";
import { WorkspaceNotFound } from "@/features/workspace/components/workspace-not-found";
import { WorkspaceShell } from "@/features/workspace/components/workspace-shell";
import type { WeddingContext } from "@/features/workspace/domain/types";
import { getWeddingWorkspaceService } from "@/features/workspace/server/get-workspace-service";

async function loadContext(weddingId: string): Promise<WeddingContext | null> {
  if (!z.uuid().safeParse(weddingId).success) return null;
  const service = await getWeddingWorkspaceService();
  const current = await service.getCurrent(weddingId);
  const summary = await service.getSummary(weddingId);
  if (!current || !summary) return null;
  return {
    viewerUserId: service.viewerUserId,
    current,
    summary,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const context = await loadContext(id);
  return { title: context?.current.wedding.title ?? "Mariage" };
}

export default async function WeddingWorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await loadContext(id);
  if (!context) {
    return <WorkspaceNotFound />;
  }

  return (
    <WeddingProvider value={context}>
      <WorkspaceShell
        weddingTitle={context.current.wedding.title}
        nav={<WorkspaceNav weddingId={id} />}
      >
        {children}
      </WorkspaceShell>
    </WeddingProvider>
  );
}
