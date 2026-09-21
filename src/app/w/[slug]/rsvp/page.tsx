import type { Metadata } from "next";

import PublicRsvpPage from "@/features/guests/pages/public-rsvp-page";

export const metadata: Metadata = {
  title: "RSVP",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

export default PublicRsvpPage;
