import { WorkspaceModulePlaceholder } from "@/features/workspace/components/workspace-module-placeholder";

export default async function ChecklistModulePage({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const { weddingId } = await params;
  return <WorkspaceModulePlaceholder moduleId="checklist" weddingId={weddingId} />;
}
