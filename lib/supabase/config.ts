export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * True once a real Supabase project has been connected (see .env.example).
 * Until then, the app shows empty/config-required states instead of crashing —
 * every page reads exclusively from Supabase, there is no mock data fallback.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
