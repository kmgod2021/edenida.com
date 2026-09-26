import { redirect } from "next/navigation";

import { OnboardingPanel } from "@/features/workspace/components/onboarding-panel";
import { WeddingPicker } from "@/features/workspace/components/wedding-picker";
import { WorkspaceEntry } from "@/features/workspace/components/workspace-entry";
import { getWeddingWorkspaceService } from "@/features/workspace/server/get-workspace-service";
import { requireWorkspaceUser } from "@/features/workspace/server/session";

export default async function AppHomePage() {
  const user = await requireWorkspaceUser();
  const service = await getWeddingWorkspaceService();
  const weddings = await service.listWeddings();
  const only = weddings.length === 1 ? weddings[0] : undefined;
  if (only) redirect(`/app/weddings/${only.id}`);

  return (
    <WorkspaceEntry email={user.email ?? null}>
      {weddings.length === 0 ? (
        <OnboardingPanel />
      ) : (
        <WeddingPicker weddings={weddings} />
      )}
    </WorkspaceEntry>
  );
}
