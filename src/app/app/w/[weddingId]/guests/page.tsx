import { WorkspaceModulePlaceholder } from "@/features/workspace/components/workspace-module-placeholder";

export default async function GuestsModulePage({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const { weddingId } = await params;
  return <WorkspaceModulePlaceholder moduleId="guests" weddingId={weddingId} />;
}
