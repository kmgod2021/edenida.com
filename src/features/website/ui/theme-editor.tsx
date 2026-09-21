"use client";

import { useState } from "react";
import type { ThemeTokens } from "@/features/website/domain/types";
import { fieldClass } from "@/features/website/ui/styles";

const COLOR_FIELDS = [
  ["background", "Fond"],
  ["surface", "Surface"],
  ["ink", "Encre"],
  ["muted", "Texte secondaire"],
  ["accent", "Accent"],
  ["accentSecondary", "Accent secondaire"],
] as const;

const HEX = /^#[0-9a-fA-F]{6}$/;

type Props = {
  theme: ThemeTokens;
  onChange: (theme: ThemeTokens) => void;
};

export function ThemeEditor({ theme, onChange }: Props) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-ink">Thème</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {COLOR_FIELDS.map(([key, label]) => (
          <ColorField
            key={`${key}-${theme[key]}`}
            id={`theme-${key}`}
            label={label}
            value={theme[key]}
            onChange={(next) => onChange({ ...theme, [key]: next })}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FontField
          label="Police des titres"
          value={theme.displayFont}
          onChange={(displayFont) => onChange({ ...theme, displayFont })}
        />
        <FontField
          label="Police du texte"
          value={theme.bodyFont}
          onChange={(bodyFont) => onChange({ ...theme, bodyFont })}
        />
      </div>
    </fieldset>
  );
}

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  const pickerValue = HEX.test(value) ? value : "#000000";

  return (
    <div className="space-y-1">
      <label className="block text-sm text-ink" htmlFor={id}>
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          value={draft}
          maxLength={7}
          spellCheck={false}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            if (HEX.test(next)) onChange(next.toLowerCase());
          }}
          className={fieldClass}
        />
        <input
          aria-label={`${label}, sélecteur`}
          type="color"
          value={pickerValue}
          onChange={(event) => onChange(event.target.value.toLowerCase())}
          className="h-10 w-12 cursor-pointer border border-line bg-bg-elevated"
        />
      </div>
    </div>
  );
}

function FontField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ThemeTokens["displayFont"];
  onChange: (value: ThemeTokens["displayFont"]) => void;
}) {
  const id = `theme-font-${label}`;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm text-ink">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value === "sans" ? "sans" : "serif")}
        className={fieldClass}
      >
        <option value="serif">Serif</option>
        <option value="sans">Sans</option>
      </select>
    </div>
  );
}
