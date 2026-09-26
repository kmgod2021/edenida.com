import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

const WORKSPACE_FIXTURE_COOKIE = "edenida_workspace";

function dropFixtureCookie(response: NextResponse, request: NextRequest) {
  if (!request.cookies.has(WORKSPACE_FIXTURE_COOKIE)) return;
  response.cookies.set(WORKSPACE_FIXTURE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { url, publishableKey } = getSupabaseEnv();

  if (!url || !publishableKey) {
    dropFixtureCookie(supabaseResponse, request);
    return supabaseResponse;
  }

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // IMPORTANT: do not add logic between createServerClient and getUser().
  await supabase.auth.getUser();

  dropFixtureCookie(supabaseResponse, request);
  return supabaseResponse;
}
