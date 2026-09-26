"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  toWeddingDetails,
  weddingDetailsSchema,
} from "../domain/validation";
import type { WeddingDetailsInput } from "../domain/types";
import { WorkspacePersistenceError } from "../data/errors";
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

function persistenceMessage(error: unknown): string | null {
  if (error instanceof WorkspacePersistenceError) return error.message;
  return null;
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
    const message = persistenceMessage(error);
    if (message) return { error: message };
    throw error;
  }
  revalidatePath("/app", "layout");
  redirect(`/app/weddings/${created.wedding.id}`);
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
    const message = persistenceMessage(error);
    if (message) return { error: message };
    throw error;
  }
  if (!updated) return { error: "Ce mariage est introuvable." };
  revalidatePath(`/app/weddings/${weddingId}`, "layout");
  redirect(`/app/weddings/${weddingId}/settings?saved=1`);
}
