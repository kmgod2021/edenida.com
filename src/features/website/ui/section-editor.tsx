"use client";

import { type ChangeEvent } from "react";
import { getBlock, type BlockListField, type ScalarField } from "@/features/website/domain/registry";
import type { SiteSection } from "@/features/website/domain/types";
import { fieldClass, quietButtonClass } from "@/features/website/ui/styles";

type Props = {
  section: SiteSection;
  error: string | null;
  onChange: (content: unknown) => void;
};

export function SectionEditor({ section, error, onChange }: Props) {
  const block = getBlock(section.type);
  const content = section.content as Record<string, unknown>;

  function commit(next: Record<string, unknown>) {
    onChange(next);
  }

  return (
    <form
      className="space-y-4"
      aria-label={`Contenu · ${block.label}`}
      onSubmit={(event) => event.preventDefault()}
    >
      <div>
        <h2 className="font-display text-2xl text-ink">{block.label}</h2>
        <p className="text-sm text-ink-muted">{block.description}</p>
      </div>

      {section.type === "rsvp" ? (
        <p className="text-sm leading-relaxed text-ink-muted">
          Les réponses des invités ne sont pas enregistrées ici. Ce bloc ne garde que le texte affiché.
        </p>
      ) : null}

      {block.fields.map((field) => (
        <ScalarInput
          key={field.key}
          id={`${section.id}-${field.key}`}
          field={field}
          value={typeof content[field.key] === "string" ? String(content[field.key]) : ""}
          onChange={(value) => commit({ ...content, [field.key]: value })}
        />
      ))}

      {block.list ? (
        <ListEditor
          sectionId={section.id}
          list={block.list}
          value={content[block.list.key]}
          onChange={(value) => {
            const listKey = block.list?.key;
            if (!listKey) return;
            commit({ ...content, [listKey]: value });
          }}
        />
      ) : null}

      {block.toggle ? (
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={content[block.toggle.key] === true}
            onChange={(event) => {
              const toggleKey = block.toggle?.key;
              if (!toggleKey) return;
              commit({ ...content, [toggleKey]: event.target.checked });
            }}
          />
          {block.toggle.label}
        </label>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </form>
  );
}

function ScalarInput({
  id,
  field,
  value,
  onChange,
}: {
  id: string;
  field: ScalarField;
  value: string;
  onChange: (value: string) => void;
}) {
  const shared = {
    id,
    name: field.key,
    value,
    maxLength: field.maxLength,
    autoComplete: "off" as const,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value),
    className: fieldClass,
  };

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm text-ink">
        {field.label}
      </label>
      {field.kind === "textarea" ? (
        <textarea {...shared} rows={4} />
      ) : (
        <input
          {...shared}
          type={field.kind === "date" ? "date" : field.kind === "url" ? "url" : "text"}
          inputMode={field.kind === "url" ? "url" : undefined}
          spellCheck={field.kind === "url" ? false : undefined}
        />
      )}
    </div>
  );
}

function ListEditor({
  sectionId,
  list,
  value,
  onChange,
}: {
  sectionId: string;
  list: BlockListField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (list.kind === "strings") {
    const items = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
    return (
      <fieldset className="space-y-2">
        <legend className="text-sm text-ink">{list.label}</legend>
        {items.length === 0 ? <p className="text-sm text-ink-muted">Aucune couleur pour l&apos;instant.</p> : null}
        {items.map((item, index) => (
          <div key={`${sectionId}-color-${index}`} className="flex gap-2">
            <label className="sr-only" htmlFor={`${sectionId}-palette-${index}`}>
              {list.itemLabel} {index + 1}
            </label>
            <input
              id={`${sectionId}-palette-${index}`}
              value={item}
              maxLength={list.maxLength}
              autoComplete="off"
              onChange={(event) => {
                const next = items.slice();
                next[index] = event.target.value;
                onChange(next);
              }}
              className={fieldClass}
            />
            <button
              type="button"
              className={quietButtonClass}
              onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
            >
              Retirer
            </button>
          </div>
        ))}
        <button
          type="button"
          className={quietButtonClass}
          disabled={items.length >= list.maxItems}
          onClick={() => onChange([...items, ""])}
        >
          {list.addLabel}
        </button>
      </fieldset>
    );
  }

  const items = Array.isArray(value)
    ? value.filter((item): item is Record<string, string> => typeof item === "object" && item !== null)
    : [];

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm text-ink">{list.label}</legend>
      {items.length === 0 ? <p className="text-sm text-ink-muted">Rien ici pour l&apos;instant.</p> : null}
      {items.map((item, index) => (
        <div key={item.id || `${sectionId}-${index}`} className="space-y-2 border border-line p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-ink-muted">
              {list.itemLabel} {index + 1}
            </p>
            <button
              type="button"
              className={quietButtonClass}
              onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
            >
              Retirer
            </button>
          </div>
          {list.fields.map((field) => (
            <ScalarInput
              key={field.key}
              id={`${sectionId}-${item.id}-${field.key}`}
              field={field}
              value={typeof item[field.key] === "string" ? item[field.key] : ""}
              onChange={(nextValue) => {
                const next = items.map((current, itemIndex) =>
                  itemIndex === index ? { ...current, [field.key]: nextValue } : current,
                );
                onChange(next);
              }}
            />
          ))}
        </div>
      ))}
      <button
        type="button"
        className={quietButtonClass}
        disabled={items.length >= list.maxItems}
        onClick={() => onChange([...items, list.createItem()])}
      >
        {list.addLabel}
      </button>
    </fieldset>
  );
}
