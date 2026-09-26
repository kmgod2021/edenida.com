import { cache } from "react";

import { createSupabaseWeddingRepository } from "../data/supabase-repository";
import {
  createWeddingWorkspaceService,
  type WeddingWorkspaceService,
} from "../data/repository";
import { createClient } from "@/lib/supabase/server";
import { requireWorkspaceUser } from "./session";

/**
 * Workspace reads and writes go through the caller's Supabase session and RLS.
 * There is no fixture cookie and no service-role fallback.
 */
export const getWeddingWorkspaceService = cache(
  async (): Promise<WeddingWorkspaceService> => {
    const user = await requireWorkspaceUser();
    const supabase = await createClient();
    return createWeddingWorkspaceService(
      createSupabaseWeddingRepository(supabase),
      user.id,
    );
  },
);
