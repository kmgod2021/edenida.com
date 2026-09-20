export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return { url, publishableKey };
}

export function isSupabaseConfigured() {
  const { url, publishableKey } = getSupabaseEnv();
  return Boolean(url && publishableKey);
}
