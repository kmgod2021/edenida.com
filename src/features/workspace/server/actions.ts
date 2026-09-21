"use server";

import { redirect } from "next/navigation";

import { createExampleWorkspaceState } from "../data/fixtures";
import { EXAMPLE_WEDDING_ID } from "../data/state";
import {
  toWeddingDetails,
  weddingDetailsSchema,
} from "../domain/validation";
import type { WeddingDetailsInput } from "../domain/types";
import {
  WorkspaceFixtureTooLargeError,
  writeWorkspaceState,
} from "./cookie-store";
import { getWeddingWorkspaceService } from "./get-workspace-service";

function invalidMessage(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Formulaire invalide";
}

function parseDetails(input: WeddingDetailsInput) {
  return weddingDetailsSchema.safeParse({
    title: input.title,
    partnerName: input.partnerName ?? "",
    weddingDate: input.weddingDate ?? "",
    timezone: input.timezone,
    currency: input.currency,
  });
}

export async function createWeddingAction(
  input: WeddingDetailsInput,
): Promise<{ error: string } | void> {
  const parsed = parseDetails(input);
  if (!parsed.success) return { error: invalidMessage(parsed.error) };

  let created;
  try {
    const service = await getWeddingWorkspaceService();
    created = await service.createWedding(toWeddingDetails(parsed.data));
  } catch (error) {
    if (error instanceof WorkspaceFixtureTooLargeError) {
      return {
        error: "Cet aperçu local est plein. La sauvegarde du compte arrive ensuite.",
      };
    }
    throw error;
  }
  redirect(`/app/w/${created.wedding.id}`);
}

export async function updateWeddingAction(
  weddingId: string,
  input: WeddingDetailsInput,
): Promise<{ error: string } | void> {
  const parsed = parseDetails(input);
  if (!parsed.success) return { error: invalidMessage(parsed.error) };

  let updated;
  try {
    const service = await getWeddingWorkspaceService();
    updated = await service.updateWedding(
      weddingId,
      toWeddingDetails(parsed.data),
    );
  } catch (error) {
    if (error instanceof WorkspaceFixtureTooLargeError) {
      return {
        error: "Cet aperçu local est plein. La sauvegarde du compte arrive ensuite.",
      };
    }
    throw error;
  }
  if (!updated) return { error: "Ce mariage est introuvable." };
  redirect(`/app/w/${weddingId}/settings?saved=1`);
}

/** Demo seed for the empty onboarding state. Removed when persistence lands. */
export async function loadExampleWorkspaceAction(): Promise<void> {
  const state = createExampleWorkspaceState(new Date());
  await writeWorkspaceState(state);
  redirect(`/app/w/${EXAMPLE_WEDDING_ID}`);
}
