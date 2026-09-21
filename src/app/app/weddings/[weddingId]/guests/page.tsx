import type { Metadata } from "next";

import GuestListPage from "@/features/guests/pages/guest-list-page";

export const metadata: Metadata = {
  title: "Invités",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default GuestListPage;
