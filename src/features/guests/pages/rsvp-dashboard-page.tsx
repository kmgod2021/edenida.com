import { RsvpDashboardScreen } from "@/features/guests/ui/rsvp-dashboard-screen";
import {
  loadWeddingPage,
  missingWedding,
  WeddingError,
  WeddingShell,
  type WeddingPageProps,
} from "@/features/guests/pages/load";

export default async function RsvpDashboardPage(props: WeddingPageProps) {
  const loaded = await loadWeddingPage(props);
  if (loaded === "missing") missingWedding();
  if (!loaded.ok) return <WeddingError body={loaded.body} />;
  const dashboard = await loaded.repo.getRsvpDashboard(loaded.wedding.id);
  if (!dashboard) missingWedding();
  return (
    <WeddingShell loaded={loaded} current="rsvp">
      <RsvpDashboardScreen
        wedding={loaded.wedding}
        dashboard={dashboard}
        ctx={loaded.ctx}
      />
    </WeddingShell>
  );
}
