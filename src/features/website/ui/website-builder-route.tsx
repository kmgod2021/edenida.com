import { loadFixtureSite } from "@/features/website/persistence/memory-repository";
import { WebsiteLoadError } from "@/features/website/persistence/repository";
import { BuilderWorkspace } from "@/features/website/ui/builder-workspace";
import { WebsiteErrorState } from "@/features/website/ui/states";

type Props = {
  params: Promise<{ weddingId: string }>;
  searchParams: Promise<{ fixture?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function WebsiteBuilderRoute({ params, searchParams }: Props) {
  const { weddingId } = await params;
  const query = await searchParams;
  const fixture = firstParam(query.fixture);
  const retryHref = `/app/w/${encodeURIComponent(weddingId)}/website`;

  const loaded = await loadFixtureSite(weddingId, fixture).then(
    (site) => ({ ok: true as const, site }),
    (error: unknown) => ({ ok: false as const, error }),
  );

  if (!loaded.ok) {
    const message =
      loaded.error instanceof WebsiteLoadError
        ? loaded.error.message
        : "Nous n'avons pas pu charger ce site. Réessayez dans un instant.";
    return <WebsiteErrorState message={message} retryHref={retryHref} />;
  }

  return <BuilderWorkspace initialSite={loaded.site} />;
}
