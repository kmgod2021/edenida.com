import { getTemplate, TEMPLATES } from "@/features/website/domain/templates";
import type { TemplateId } from "@/features/website/domain/types";

type Props = {
  templateId: TemplateId;
  onChange: (templateId: TemplateId) => void;
};

export function TemplatePicker({ templateId, onChange }: Props) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-ink">Modèle</legend>
      <p className="mt-1 text-sm text-ink-muted">
        Changer de modèle applique sa palette. Le contenu des sections reste en place.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {TEMPLATES.map((template) => {
          const selected = template.id === templateId;
          return (
            <label
              key={template.id}
              className={`flex cursor-pointer gap-3 border px-3 py-3 transition focus-within:ring-2 focus-within:ring-accent ${
                selected ? "border-accent bg-accent-soft/50" : "border-line bg-bg-elevated hover:border-ink/20"
              }`}
            >
              <input
                type="radio"
                name="template"
                value={template.id}
                checked={selected}
                onChange={() => onChange(template.id)}
                className="mt-1 size-4 shrink-0 accent-accent"
              />
              <span>
                <span className="block text-sm font-medium text-ink">{template.label}</span>
                <span className="mt-1 block text-xs leading-relaxed text-ink-muted">{template.description}</span>
              </span>
            </label>
          );
        })}
      </div>
      <p className="sr-only">Modèle actuel : {getTemplate(templateId).label}</p>
    </fieldset>
  );
}
