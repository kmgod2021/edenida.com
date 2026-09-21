import type { Metadata } from "next";

import HouseholdPage from "@/features/guests/pages/household-page";

export const metadata: Metadata = {
  title: "Foyers",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default HouseholdPage;
