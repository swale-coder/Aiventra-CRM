import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./config";

/**
 * Privileged, server-only Supabase client using the service role key. This bypasses
 * Row Level Security entirely, so it must NEVER be imported into client components
 * and must only be used from Route Handlers / Server Actions for operations that
 * genuinely require elevated access (e.g. inviting a user by email, accepting an
 * org invite on their behalf).
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
