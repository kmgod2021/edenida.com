"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { updateWeddingAction } from "../server/actions";
import type { WeddingDetailsInput } from "../domain/types";
import { detailsToFormValues, toWeddingDetails, weddingDetailsSchema } from "../domain/validation";
import { primaryButtonClass } from "./classes";
import { useWeddingContext } from "./wedding-provider";
import { WeddingDetailsFields } from "./wedding-details-fields";

export function WeddingSettingsForm() {
  const router = useRouter();
  const { current } = useWeddingContext();
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
    const input: WeddingDetailsInput = toWeddingDetails(parsed.data);
    const result = await updateWeddingAction(current.wedding.id, input);
    if (result?.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    router.refresh();
  }

  const values = detailsToFormValues({
    title: current.wedding.title,
    partnerName: current.partnerDisplayName,
    weddingDate: current.wedding.weddingDate,
    timezone: current.wedding.timezone,
    currency: current.wedding.currency,
  });

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-6" noValidate>
      <WeddingDetailsFields values={values} />
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
