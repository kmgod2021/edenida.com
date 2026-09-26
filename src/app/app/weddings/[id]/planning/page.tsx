import { WorkspaceModulePlaceholder } from "@/features/workspace/components/workspace-module-placeholder";

export default async function PlanningModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WorkspaceModulePlaceholder moduleId="planning" weddingId={id} />;
}
