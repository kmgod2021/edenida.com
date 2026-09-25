import { redirect } from "next/navigation";

import { OnboardingPanel } from "@/features/workspace/components/onboarding-panel";
import { WeddingPicker } from "@/features/workspace/components/wedding-picker";
import { WorkspaceEntry } from "@/features/workspace/components/workspace-entry";
import { loadExampleWorkspaceAction } from "@/features/workspace/server/actions";
import { getWeddingWorkspaceService } from "@/features/workspace/server/get-workspace-service";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function AppHomePage() {
  const service = await getWeddingWorkspaceService();
  const weddings = await service.listWeddings();
  const only = weddings.length === 1 ? weddings[0] : undefined;
  if (only) redirect(`/app/weddings/${only.id}`);

  let email: string | null = null;
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      email = user?.email ?? null;
    } catch {
      email = null;
    }
  }

  return (
    <WorkspaceEntry email={email}>
      {weddings.length === 0 ? (
        <OnboardingPanel loadExampleAction={loadExampleWorkspaceAction} />
      ) : (
        <WeddingPicker weddings={weddings} />
      )}
    </WorkspaceEntry>
  );
}
