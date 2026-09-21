"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  applyTheme,
  moveSection,
  setSectionEnabled,
  switchTemplate,
  updateSectionContent,
} from "@/features/website/domain/operations";
import type { SiteDocument, TemplateId } from "@/features/website/domain/types";
import { PreviewStage } from "@/features/website/ui/preview-stage";
import { SectionEditor } from "@/features/website/ui/section-editor";
import { SectionList } from "@/features/website/ui/section-list";
import type { PreviewViewport } from "@/features/website/ui/site-canvas";
import { TemplatePicker } from "@/features/website/ui/template-picker";
import { ThemeEditor } from "@/features/website/ui/theme-editor";

type Panel = "edit" | "preview";

type Props = {
  initialSite: SiteDocument;
};

export function BuilderWorkspace({ initialSite }: Props) {
  const [site, setSite] = useState(initialSite);
  const [selectedId, setSelectedId] = useState(initialSite.sections[0]?.id ?? "");
  const [viewport, setViewport] = useState<PreviewViewport>("desktop");
  const [panel, setPanel] = useState<Panel>("edit");
  const [notice, setNotice] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);

  const selected = useMemo(
    () => site.sections.find((section) => section.id === selectedId) ?? site.sections[0],
    [site.sections, selectedId],
  );

  function apply(result: { ok: boolean; site: SiteDocument; message?: string }, successNotice?: string) {
    if (!result.ok) {
      setContentError(result.message ?? "Modification impossible.");
      return;
    }
    setContentError(null);
    setSite(result.site);
    if (successNotice) setNotice(successNotice);
  }

  const editor = (
    <div className="space-y-8">
      <TemplatePicker
        templateId={site.presentation.templateId}
        onChange={(templateId: TemplateId) => {
          setSite(switchTemplate(site, templateId));
          setContentError(null);
          setNotice("Modèle appliqué. Le contenu des sections est inchangé.");
        }}
      />
      <SectionList
        sections={site.sections}
        selectedId={selected?.id ?? ""}
        onSelect={setSelectedId}
        onToggle={(sectionId, enabled) => apply(setSectionEnabled(site, sectionId, enabled))}
        onMove={(sectionId, direction) => apply(moveSection(site, sectionId, direction))}
      />
      {selected ? (
        <SectionEditor
          key={selected.id}
          section={selected}
          error={contentError}
          onChange={(content) => apply(updateSectionContent(site, selected.id, content))}
        />
      ) : null}
      <ThemeEditor
        theme={site.presentation.theme}
        onChange={(theme) => apply(applyTheme(site, theme))}
      />
    </div>
  );

  const preview = (
    <PreviewStage
      site={site}
      viewport={viewport}
      onEnableHero={() => {
        const hero = site.sections.find((section) => section.type === "hero");
        if (!hero) return;
        apply(setSectionEnabled(site, hero.id, true));
        setSelectedId(hero.id);
        setPanel("edit");
      }}
    />
  );

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <header className="border-b border-line bg-bg-elevated/90">
        <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <Link href="/app" className="font-display text-2xl leading-none text-ink">
              Edenida
            </Link>
            <h1 className="mt-1 text-sm font-medium">Site web</h1>
            <p className="truncate text-sm text-ink-muted">
              {site.title} · Brouillon local · non publié
            </p>
          </div>
          <fieldset role="radiogroup" aria-label="Format d'aperçu" className="flex items-center gap-2">
            <ViewportOption
              name="Bureau"
              checked={viewport === "desktop"}
              onSelect={() => setViewport("desktop")}
            />
            <ViewportOption
              name="Mobile"
              checked={viewport === "mobile"}
              onSelect={() => setViewport("mobile")}
            />
          </fieldset>
        </div>
      </header>

      <div className="border-b border-line px-4 py-2 lg:hidden">
        <div role="tablist" aria-label="Constructeur" className="flex gap-2">
          <PanelTab name="Éditer" selected={panel === "edit"} onSelect={() => setPanel("edit")} />
          <PanelTab name="Aperçu" selected={panel === "preview"} onSelect={() => setPanel("preview")} />
        </div>
      </div>

      {notice ? (
        <p role="status" className="border-b border-line bg-accent-soft/40 px-4 py-2 text-sm text-ink sm:px-6">
          {notice}
        </p>
      ) : null}

      <div className="mx-auto grid w-full max-w-[1600px] lg:h-[calc(100dvh-5.5rem)] lg:grid-cols-[minmax(320px,440px)_minmax(0,1fr)]">
        <div className={`${panel === "edit" ? "block" : "hidden"} border-line px-4 py-6 lg:block lg:overflow-y-auto lg:border-r lg:px-6`}>
          {editor}
          <p className="mt-8 text-xs leading-relaxed text-ink-muted">
            Adresse prévue : /w/{site.slug}. L&apos;enregistrement et la publication arrivent avec
            l&apos;intégration des données.
          </p>
        </div>
        <div className={`${panel === "preview" ? "block" : "hidden"} bg-bg px-4 py-6 lg:block lg:overflow-y-auto lg:px-8`}>
          {preview}
        </div>
      </div>
    </div>
  );
}

function ViewportOption({
  name,
  checked,
  onSelect,
}: {
  name: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={`cursor-pointer border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        checked ? "border-ink bg-ink text-bg-elevated" : "border-line bg-bg-elevated text-ink"
      }`}
    >
      {name}
    </button>
  );
}

function PanelTab({
  name,
  selected,
  onSelect,
}: {
  name: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onSelect}
      className={`rounded-md px-3 py-2 text-sm ${selected ? "bg-ink text-bg-elevated" : "text-ink-muted"}`}
    >
      {name}
    </button>
  );
}
