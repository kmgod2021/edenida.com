import type { Metadata } from "next";

import NewGuestPage from "@/features/guests/pages/guest-editor-page";

export const metadata: Metadata = {
  title: "Nouvel invité",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default NewGuestPage;
