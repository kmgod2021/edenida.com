import { readPlanningDemoQuery } from "@/features/planning/demo-query";
import { PlanningWorkspace } from "@/features/planning/ui/planning-workspace";

export const metadata = {
  title: "Planning",
  robots: { index: false, follow: false },
};

export default async function PlanningPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    scenario?: string | string[];
    date?: string | string[];
    today?: string | string[];
  }>;
}) {
  const { slug } = await params;
  const query = readPlanningDemoQuery(await searchParams);

  return (
    <PlanningWorkspace
      key={`${slug}:${query.scenario}:${query.weddingDate ?? ""}:${query.today}`}
      weddingId={slug}
      scenario={query.scenario}
      weddingDate={query.weddingDate}
      today={query.today}
    />
  );
}
