import { WorkspaceModulePlaceholder } from "@/features/workspace/components/workspace-module-placeholder";

export default async function GuestsModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WorkspaceModulePlaceholder moduleId="guests" weddingId={id} />;
}
