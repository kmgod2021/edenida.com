import { safeNextPath } from "@/lib/auth/safe-next";

export const AUTH_ERROR_PATH = "/auth/error";

export type CodeExchangeResult = {
  error: unknown;
};

/**
 * Authorization-code callback decision.
 * Missing codes and failed exchanges stay on a generic error path.
 * The destination is always an internal relative path.
 */
export async function completeAuthCallback(input: {
  code: string | null;
  next: string | null;
  exchangeCodeForSession: (code: string) => Promise<CodeExchangeResult>;
}): Promise<{ redirectPath: string }> {
  const code = input.code?.trim() ?? "";
  if (!code) {
    return { redirectPath: AUTH_ERROR_PATH };
  }

  try {
    const { error } = await input.exchangeCodeForSession(code);
    if (error) {
      return { redirectPath: AUTH_ERROR_PATH };
    }
  } catch {
    return { redirectPath: AUTH_ERROR_PATH };
  }

  return { redirectPath: safeNextPath(input.next) };
}
