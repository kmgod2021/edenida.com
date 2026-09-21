import { getBlock } from "@/features/website/domain/registry";
import type { SiteSection } from "@/features/website/domain/types";
import { quietButtonClass } from "@/features/website/ui/styles";

type Props = {
  sections: SiteSection[];
  selectedId: string;
  onSelect: (sectionId: string) => void;
  onToggle: (sectionId: string, enabled: boolean) => void;
  onMove: (sectionId: string, direction: "up" | "down") => void;
};

export function SectionList({ sections, selectedId, onSelect, onToggle, onMove }: Props) {
  return (
    <div>
      <h2 className="text-sm font-medium text-ink">Sections</h2>
      <ul aria-label="Sections" className="mt-2 divide-y divide-line border-y border-line">
        {sections.map((section, index) => {
          const block = getBlock(section.type);
          const selected = section.id === selectedId;
          return (
            <li key={section.id} className="flex items-center gap-2 py-1.5">
              <input
                type="checkbox"
                checked={section.enabled}
                aria-label={`Afficher ${block.label}`}
                onChange={(event) => onToggle(section.id, event.target.checked)}
                className="size-4 accent-accent"
              />
              <button
                type="button"
                aria-current={selected ? "true" : undefined}
                onClick={() => onSelect(section.id)}
                className={`min-w-0 flex-1 truncate rounded-sm px-1 py-1 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  selected ? "font-medium text-ink" : "text-ink-muted"
                }`}
              >
                {block.label}
              </button>
              <button
                type="button"
                className={quietButtonClass}
                aria-label={`Monter ${block.label}`}
                disabled={index === 0}
                onClick={() => onMove(section.id, "up")}
              >
                Haut
              </button>
              <button
                type="button"
                className={quietButtonClass}
                aria-label={`Descendre ${block.label}`}
                disabled={index === sections.length - 1}
                onClick={() => onMove(section.id, "down")}
              >
                Bas
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
