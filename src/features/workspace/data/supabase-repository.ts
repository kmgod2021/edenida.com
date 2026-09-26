import type { SupabaseClient } from "@supabase/supabase-js";

import { emptyModuleSignals } from "../domain/progress";
import { buildWeddingSummary, readCurrentWedding } from "../domain/summary";
import type {
  CreateWeddingInput,
  CurrentWedding,
  UpdateWeddingInput,
  Wedding,
  WeddingMember,
  WeddingMemberRole,
  WeddingSummary,
} from "../domain/types";
import {
  WORKSPACE_CREATE_FAILED,
  WORKSPACE_SAVE_FAILED,
  WORKSPACE_SAVE_FORBIDDEN,
  WorkspacePersistenceError,
} from "./errors";
import type { WeddingRepository } from "./repository";

type WeddingRow = {
  id: string;
  title: string;
  wedding_date: string | null;
  timezone: string;
  currency: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type MemberRow = {
  id: string;
  wedding_id: string;
  user_id: string;
  role: WeddingMemberRole;
  created_at: string;
};

const WEDDING_COLUMNS =
  "id, title, wedding_date, timezone, currency, created_by, created_at, updated_at";
const MEMBER_COLUMNS = "id, wedding_id, user_id, role, created_at";

function mapWedding(row: WeddingRow): Wedding {
  return {
    id: row.id,
    title: row.title,
    weddingDate: row.wedding_date,
    timezone: row.timezone,
    currency: row.currency.trim(),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMember(row: MemberRow): WeddingMember {
  return {
    id: row.id,
    weddingId: row.wedding_id,
    userId: row.user_id,
    role: row.role,
    createdAt: row.created_at,
  };
}

function fail(message: string, code: string | undefined): never {
  console.error("workspace persistence", code ?? "unknown");
  throw new WorkspacePersistenceError(message);
}

/**
 * RLS is the access filter. `userId` must be the session user from
 * `auth.getUser()`; it is never sent as a membership target.
 * Partner names are not stored: `wedding_settings` does not exist yet.
 */
export function createSupabaseWeddingRepository(
  supabase: SupabaseClient,
): WeddingRepository {
  async function profileNames(
    userId: string,
  ): Promise<Record<string, string>> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", userId)
      .maybeSingle();
    if (error) fail(WORKSPACE_SAVE_FAILED, error.code);
    const name = data?.full_name?.trim();
    if (!data?.id || !name) return {};
    return { [data.id]: name };
  }

  async function loadCurrent(
    userId: string,
    weddingId: string,
  ): Promise<CurrentWedding | null> {
    const weddingResult = await supabase
      .from("weddings")
      .select(WEDDING_COLUMNS)
      .eq("id", weddingId)
      .maybeSingle();
    if (weddingResult.error) {
      fail(WORKSPACE_SAVE_FAILED, weddingResult.error.code);
    }
    if (!weddingResult.data) return null;

    const membersResult = await supabase
      .from("wedding_members")
      .select(MEMBER_COLUMNS)
      .eq("wedding_id", weddingId);
    if (membersResult.error) {
      fail(WORKSPACE_SAVE_FAILED, membersResult.error.code);
    }

    return readCurrentWedding({
      wedding: mapWedding(weddingResult.data as WeddingRow),
      members: ((membersResult.data ?? []) as MemberRow[]).map(mapMember),
      viewerUserId: userId,
      partnerDisplayName: null,
      profileNames: await profileNames(userId),
    });
  }

  return {
    async listWeddings(): Promise<readonly Wedding[]> {
      const { data, error } = await supabase
        .from("weddings")
        .select(WEDDING_COLUMNS)
        .order("created_at", { ascending: false });
      if (error) fail(WORKSPACE_SAVE_FAILED, error.code);
      return ((data ?? []) as WeddingRow[]).map(mapWedding);
    },

    async getCurrent(userId, weddingId): Promise<CurrentWedding | null> {
      return loadCurrent(userId, weddingId);
    },

    async getSummary(userId, weddingId): Promise<WeddingSummary | null> {
      const current = await loadCurrent(userId, weddingId);
      if (!current) return null;
      return buildWeddingSummary({
        wedding: current.wedding,
        partnerDisplayName: null,
        signals: emptyModuleSignals(),
        now: new Date(),
      });
    },

    async createWedding(userId, input: CreateWeddingInput) {
      const { data, error } = await supabase.rpc("create_wedding_with_owner", {
        p_title: input.title,
        p_wedding_date: input.weddingDate,
        p_timezone: input.timezone,
        p_currency: input.currency,
      });
      if (error || typeof data !== "string") {
        fail(WORKSPACE_CREATE_FAILED, error?.code);
      }

      const current = await loadCurrent(userId, data);
      if (
        !current ||
        current.wedding.createdBy !== userId ||
        current.membership.userId !== userId ||
        current.membership.role !== "owner"
      ) {
        throw new WorkspacePersistenceError(WORKSPACE_CREATE_FAILED);
      }
      return current;
    },

    async updateWedding(
      userId,
      weddingId,
      input: UpdateWeddingInput,
    ): Promise<CurrentWedding | null> {
      const { data, error } = await supabase
        .from("weddings")
        .update({
          title: input.title,
          wedding_date: input.weddingDate,
          timezone: input.timezone,
          currency: input.currency,
          updated_at: new Date().toISOString(),
        })
        .eq("id", weddingId)
        .select("id");
      if (error) {
        if (error.code === "42501") {
          throw new WorkspacePersistenceError(WORKSPACE_SAVE_FORBIDDEN);
        }
        fail(WORKSPACE_SAVE_FAILED, error.code);
      }
      if (!data?.length) {
        const visible = await loadCurrent(userId, weddingId);
        if (visible) {
          throw new WorkspacePersistenceError(WORKSPACE_SAVE_FORBIDDEN);
        }
        return null;
      }
      return loadCurrent(userId, weddingId);
    },
  };
}
