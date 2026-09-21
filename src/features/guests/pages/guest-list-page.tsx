import { GuestListScreen } from "@/features/guests/ui/guest-list-screen";
import {
  loadWeddingPage,
  missingWedding,
  WeddingError,
  WeddingShell,
  type WeddingPageProps,
} from "@/features/guests/pages/load";

export default async function GuestListPage(props: WeddingPageProps) {
  const loaded = await loadWeddingPage(props);
  if (loaded === "missing") missingWedding();
  if (!loaded.ok) return <WeddingError body={loaded.body} />;
  const [guests, households] = await Promise.all([
    loaded.repo.listGuests(loaded.wedding.id),
    loaded.repo.listHouseholds(loaded.wedding.id),
  ]);
  return (
    <WeddingShell loaded={loaded} current="guests">
      <GuestListScreen
        wedding={loaded.wedding}
        guests={guests}
        households={households}
        ctx={loaded.ctx}
      />
    </WeddingShell>
  );
}
