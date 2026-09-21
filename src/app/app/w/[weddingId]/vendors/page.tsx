import { WorkspaceModulePlaceholder } from "@/features/workspace/components/workspace-module-placeholder";

export default async function VendorsModulePage({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const { weddingId } = await params;
  return <WorkspaceModulePlaceholder moduleId="vendors" weddingId={weddingId} />;
}
