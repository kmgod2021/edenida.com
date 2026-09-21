import type { Metadata } from "next";

import { GuestEditorPage } from "@/features/guests/pages/guest-editor-page";

export const metadata: Metadata = {
  title: "Fiche invité",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default GuestEditorPage;
