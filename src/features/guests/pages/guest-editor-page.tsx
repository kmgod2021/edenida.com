import { notFound } from "next/navigation";

import { GuestEditorScreen } from "@/features/guests/ui/guest-editor-screen";
import {
  loadWeddingPage,
  missingWedding,
  WeddingError,
  WeddingShell,
  type WeddingPageProps,
} from "@/features/guests/pages/load";

export default async function NewGuestPage(props: WeddingPageProps) {
  const loaded = await loadWeddingPage(props);
  if (loaded === "missing") missingWedding();
  if (!loaded.ok) return <WeddingError body={loaded.body} />;
  const households = await loaded.repo.listHouseholds(loaded.wedding.id);
  return (
    <WeddingShell loaded={loaded} current="guests">
      <GuestEditorScreen
        wedding={loaded.wedding}
        guest={null}
        households={households}
        ctx={loaded.ctx}
      />
    </WeddingShell>
  );
}

export async function GuestEditorPage(
  props: WeddingPageProps & { params: Promise<{ weddingId: string; guestId: string }> },
) {
  const { guestId } = await props.params;
  const loaded = await loadWeddingPage(props);
  if (loaded === "missing") missingWedding();
  if (!loaded.ok) return <WeddingError body={loaded.body} />;
  const [guest, households] = await Promise.all([
    loaded.repo.getGuest(loaded.wedding.id, guestId),
    loaded.repo.listHouseholds(loaded.wedding.id),
  ]);
  if (!guest) notFound();
  return (
    <WeddingShell loaded={loaded} current="guests">
      <GuestEditorScreen
        wedding={loaded.wedding}
        guest={guest}
        households={households}
        ctx={loaded.ctx}
      />
    </WeddingShell>
  );
}
