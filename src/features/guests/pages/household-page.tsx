import { HouseholdScreen } from "@/features/guests/ui/household-screen";
import {
  loadWeddingPage,
  missingWedding,
  WeddingError,
  WeddingShell,
  type WeddingPageProps,
} from "@/features/guests/pages/load";

export default async function HouseholdPage(props: WeddingPageProps) {
  const loaded = await loadWeddingPage(props);
  if (loaded === "missing") missingWedding();
  if (!loaded.ok) return <WeddingError body={loaded.body} />;
  const households = await loaded.repo.listHouseholds(loaded.wedding.id);
  return (
    <WeddingShell loaded={loaded} current="households">
      <HouseholdScreen wedding={loaded.wedding} households={households} ctx={loaded.ctx} />
    </WeddingShell>
  );
}
