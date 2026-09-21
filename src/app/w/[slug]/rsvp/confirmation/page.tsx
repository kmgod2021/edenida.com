import type { Metadata } from "next";

import RsvpConfirmationPage from "@/features/guests/pages/rsvp-confirmation-page";

export const metadata: Metadata = {
  title: "Confirmation RSVP",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

export default RsvpConfirmationPage;
