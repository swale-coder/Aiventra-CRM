import { createBrowserClient } from "@supabase/ssr";
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } from "./config";

/**
 * Browser-side Supabase client for use in Client Components.
 * Returns null in demo mode (no env vars set) so callers can gracefully no-op.
 */
export function createClient() {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
