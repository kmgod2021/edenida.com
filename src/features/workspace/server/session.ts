import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function missingSession(message: string): boolean {
  return /session missing/i.test(message);
}

/**
 * The signed-in Supabase user is the only workspace viewer.
 * Missing configuration throws from the server client. A missing session
 * redirects to login. Other auth failures stay visible.
 */
export const requireWorkspaceUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error && !missingSession(error.message)) {
    throw new Error("Impossible de vérifier la session.");
  }
  if (!user) redirect("/login");
  return user;
});
