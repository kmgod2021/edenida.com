import type { FieldErrors } from "@/features/guests/domain/form-state";
import type {
  GuestDetail,
  GuestListItem,
  GuestWriteInput,
  HouseholdListItem,
  HouseholdWriteInput,
  PublicRsvpSubmission,
  PublicRsvpView,
  RsvpConfirmation,
  RsvpDashboard,
  WeddingGuestScope,
} from "@/features/guests/domain/types";

export type SaveGuestResult =
  | { ok: true; guest: GuestDetail }
  | { ok: false; message: string; fieldErrors: FieldErrors };

export type DeleteGuestResult = { ok: true } | { ok: false; message: string };

export type SaveHouseholdResult =
  | { ok: true; household: HouseholdListItem }
  | { ok: false; message: string; fieldErrors: FieldErrors };

export type PublicRsvpResult =
  | { ok: true; view: PublicRsvpView }
  | { ok: false; message: string };

export type SubmitRsvpResult =
  | { ok: true; confirmation: RsvpConfirmation }
  | { ok: false; message: string; fieldErrors: FieldErrors };

export type ConfirmationResult =
  | {
      ok: true;
      weddingTitle: string;
      guestFirstName: string;
      confirmation: RsvpConfirmation | null;
    }
  | { ok: false; message: string };

/**
 * Wave A port. The Supabase implementation must satisfy the same methods
 * without accepting client-supplied session or scenario selectors.
 */
export interface GuestRepository {
  getWedding(weddingId: string): Promise<WeddingGuestScope | null>;
  listGuests(weddingId: string): Promise<GuestListItem[]>;
  getGuest(weddingId: string, guestId: string): Promise<GuestDetail | null>;
  saveGuest(weddingId: string, input: GuestWriteInput): Promise<SaveGuestResult>;
  deleteGuest(weddingId: string, guestId: string): Promise<DeleteGuestResult>;
  listHouseholds(weddingId: string): Promise<HouseholdListItem[]>;
  saveHousehold(
    weddingId: string,
    input: HouseholdWriteInput,
  ): Promise<SaveHouseholdResult>;
  getRsvpDashboard(weddingId: string): Promise<RsvpDashboard | null>;
  getPublicRsvp(slug: string, token: string): Promise<PublicRsvpResult>;
  submitPublicRsvp(
    slug: string,
    token: string,
    input: PublicRsvpSubmission,
  ): Promise<SubmitRsvpResult>;
  getRsvpConfirmation(slug: string, token: string): Promise<ConfirmationResult>;
}
