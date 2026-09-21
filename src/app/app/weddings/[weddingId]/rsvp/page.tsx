import type { Metadata } from "next";

import RsvpDashboardPage from "@/features/guests/pages/rsvp-dashboard-page";

export const metadata: Metadata = {
  title: "Réponses",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default RsvpDashboardPage;
