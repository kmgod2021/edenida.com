import type { SiteDocument } from "@/features/website/domain/types";
import { SiteCanvas, type PreviewViewport } from "@/features/website/ui/site-canvas";
import { primaryButtonClass } from "@/features/website/ui/styles";

type Props = {
  site: SiteDocument;
  viewport: PreviewViewport;
  onEnableHero: () => void;
};

export function PreviewStage({ site, viewport, onEnableHero }: Props) {
  const visible = site.sections.some((section) => section.enabled);
  const frame =
    viewport === "mobile"
      ? "mx-auto w-full max-w-[390px] overflow-hidden rounded-lg border border-line shadow-[var(--shadow-soft)]"
      : "w-full overflow-hidden rounded-lg border border-line";

  return (
    <div role="region" aria-label="Aperçu du site" data-viewport={viewport} className={frame}>
      {visible ? (
        <SiteCanvas site={site} viewport={viewport} />
      ) : (
        <div className="flex min-h-80 flex-col items-start justify-center gap-4 bg-bg-elevated px-8 py-16">
          <h2 className="font-display text-3xl text-ink">Aucune section visible</h2>
          <p className="max-w-sm leading-relaxed text-ink-muted">
            Activez une section pour composer l&apos;aperçu. Le texte déjà écrit est conservé.
          </p>
          <button type="button" className={primaryButtonClass} onClick={onEnableHero}>
            Afficher l&apos;ouverture
          </button>
        </div>
      )}
    </div>
  );
}
