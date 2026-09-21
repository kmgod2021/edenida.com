import { redirect } from "next/navigation";

import { OnboardingPanel } from "@/features/workspace/components/onboarding-panel";
import { WeddingPicker } from "@/features/workspace/components/wedding-picker";
import { WorkspaceEntry } from "@/features/workspace/components/workspace-entry";
import { loadExampleWorkspaceAction } from "@/features/workspace/server/actions";
import { getWeddingWorkspaceService } from "@/features/workspace/server/get-workspace-service";

export default async function AppHomePage() {
  const service = await getWeddingWorkspaceService();
  const weddings = await service.listWeddings();
  const only = weddings.length === 1 ? weddings[0] : undefined;
  if (only) redirect(`/app/w/${only.id}`);

  return (
    <WorkspaceEntry>
      {weddings.length === 0 ? (
        <OnboardingPanel loadExampleAction={loadExampleWorkspaceAction} />
      ) : (
        <WeddingPicker weddings={weddings} />
      )}
    </WorkspaceEntry>
  );
}
