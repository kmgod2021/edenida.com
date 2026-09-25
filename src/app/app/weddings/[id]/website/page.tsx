import { WorkspaceModulePlaceholder } from "@/features/workspace/components/workspace-module-placeholder";

export default async function WebsiteModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WorkspaceModulePlaceholder moduleId="website" weddingId={id} />;
}
