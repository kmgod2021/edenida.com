"use client";

import { useState, type FormEvent } from "react";

import type { WeddingDetailsInput } from "../domain/types";
import { toWeddingDetails, weddingDetailsSchema } from "../domain/validation";
import { primaryButtonClass } from "./classes";
import { WeddingDetailsFields } from "./wedding-details-fields";

export function CreateWeddingForm({
  action,
}: {
  action: (input: WeddingDetailsInput) => Promise<{ error: string } | void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const parsed = weddingDetailsSchema.safeParse({
      title: form.get("title"),
      partnerName: form.get("partnerName"),
      weddingDate: form.get("weddingDate"),
      timezone: form.get("timezone"),
      currency: form.get("currency"),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }
    setPending(true);
    const result = await action(toWeddingDetails(parsed.data));
    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-6" noValidate>
      <WeddingDetailsFields />
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Création…" : "Créer le mariage"}
      </button>
    </form>
  );
}
