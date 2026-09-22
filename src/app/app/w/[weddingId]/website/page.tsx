import { Suspense } from "react";
import { WebsiteBuilderRoute } from "@/features/website/ui/website-builder-route";
import { WebsiteLoadingState } from "@/features/website/ui/states";

type Props = {
  params: Promise<{ weddingId: string }>;
  searchParams: Promise<{ fixture?: string | string[] }>;
};

export const metadata = {
  title: "Site web",
  robots: { index: false, follow: false },
};

export default function WeddingWebsiteBuilderPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<WebsiteLoadingState />}>
      <WebsiteBuilderRoute params={params} searchParams={searchParams} />
    </Suspense>
  );
}
