"use server";

import { redirect } from "next/navigation";

import { isGuestDataError } from "@/features/guests/data/errors";
import { getGuestRepository } from "@/features/guests/data/get-repository";
import {
  issuesToFieldErrors,
  type FormState,
} from "@/features/guests/domain/form-state";
import { PUBLIC_LINK_MESSAGE } from "@/features/guests/domain/public-rsvp";
import {
  guestPaths,
  parseRouteContext,
  publicRsvpPath,
} from "@/features/guests/domain/route-context";
import {
  guestFormValues,
  guestWriteSchema,
  householdFormValues,
  householdWriteSchema,
  publicRsvpFormValues,
  publicRsvpSchema,
} from "@/features/guests/domain/schemas";

const ID_PATTERN = /^[a-zA-Z0-9_-]{1,80}$/;
const SLUG_PATTERN = /^[a-z0-9-]{1,80}$/;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{8,256}$/;

function readId(value: FormDataEntryValue | null) {
  return typeof value === "string" && ID_PATTERN.test(value) ? value : null;
}

function ctxFromForm(formData: FormData) {
  return parseRouteContext({
    session: typeof formData.get("session") === "string" ? formData.get("session") as string : undefined,
    scenario:
      typeof formData.get("scenario") === "string"
        ? (formData.get("scenario") as string)
        : undefined,
  });
}

function unavailable(error: unknown): FormState | null {
  if (!isGuestDataError(error)) return null;
  return { message: error.message, fieldErrors: {} };
}

export async function saveGuestAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = ctxFromForm(formData);
  const weddingId = readId(formData.get("weddingId"));
  if (!weddingId) return { message: "Mariage introuvable.", fieldErrors: {} };

  const parsed = guestWriteSchema.safeParse(guestFormValues(formData));
  if (!parsed.success) {
    return {
      message: "Le formulaire contient des erreurs.",
      fieldErrors: issuesToFieldErrors(parsed.error.issues),
    };
  }

  try {
    const result = await getGuestRepository(ctx).saveGuest(weddingId, parsed.data);
    if (!result.ok) return { message: result.message, fieldErrors: result.fieldErrors };
  } catch (error) {
    const failure = unavailable(error);
    if (failure) return failure;
    throw error;
  }

  redirect(guestPaths(weddingId, ctx).list({ notice: "guest-saved" }));
}

export async function deleteGuestAction(formData: FormData): Promise<void> {
  const ctx = ctxFromForm(formData);
  const weddingId = readId(formData.get("weddingId"));
  const guestId = readId(formData.get("guestId"));
  if (!weddingId || !guestId) return;

  try {
    const result = await getGuestRepository(ctx).deleteGuest(weddingId, guestId);
    if (!result.ok) return;
  } catch (error) {
    if (isGuestDataError(error)) return;
    throw error;
  }

  redirect(guestPaths(weddingId, ctx).list({ notice: "guest-removed" }));
}

export async function saveHouseholdAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = ctxFromForm(formData);
  const weddingId = readId(formData.get("weddingId"));
  if (!weddingId) return { message: "Mariage introuvable.", fieldErrors: {} };

  const parsed = householdWriteSchema.safeParse(householdFormValues(formData));
  if (!parsed.success) {
    return {
      message: "Le formulaire contient des erreurs.",
      fieldErrors: issuesToFieldErrors(parsed.error.issues),
    };
  }

  try {
    const result = await getGuestRepository(ctx).saveHousehold(weddingId, parsed.data);
    if (!result.ok) return { message: result.message, fieldErrors: result.fieldErrors };
  } catch (error) {
    const failure = unavailable(error);
    if (failure) return failure;
    throw error;
  }

  redirect(guestPaths(weddingId, ctx).households({ notice: "household-saved" }));
}

export async function submitRsvpAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = ctxFromForm(formData);
  const slugValue = formData.get("slug");
  const tokenValue = formData.get("token");
  const slug = typeof slugValue === "string" ? slugValue : "";
  const token = typeof tokenValue === "string" ? tokenValue : "";
  if (!SLUG_PATTERN.test(slug) || !TOKEN_PATTERN.test(token)) {
    return { message: PUBLIC_LINK_MESSAGE, fieldErrors: {} };
  }

  const parsed = publicRsvpSchema.safeParse(publicRsvpFormValues(formData));
  if (!parsed.success) {
    return {
      message: "La réponse contient des erreurs.",
      fieldErrors: issuesToFieldErrors(parsed.error.issues),
    };
  }

  try {
    const result = await getGuestRepository(ctx).submitPublicRsvp(slug, token, parsed.data);
    if (!result.ok) return { message: result.message, fieldErrors: result.fieldErrors };
  } catch (error) {
    const failure = unavailable(error);
    if (failure) return failure;
    throw error;
  }

  redirect(publicRsvpPath(slug, ctx, token, true));
}
