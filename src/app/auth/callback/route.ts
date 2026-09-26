import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { completeAuthCallback } from "@/lib/auth/callback";
import { safeNextPath } from "@/lib/auth/safe-next";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const decision = await completeAuthCallback({
    code: request.nextUrl.searchParams.get("code"),
    next: request.nextUrl.searchParams.get("next"),
    exchangeCodeForSession: async (code) => {
      const supabase = await createClient();
      return supabase.auth.exchangeCodeForSession(code);
    },
  });

  const path = safeNextPath(decision.redirectPath, "/auth/error");
  redirect(path);
}
