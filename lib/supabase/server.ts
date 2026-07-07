import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } from "./config";

/**
 * Server-side Supabase client for use in Server Components, Route Handlers, and
 * Server Actions. Returns null in demo mode so callers can gracefully fall back
 * to mock data.
 */
export async function createClient() {
  if (!isSupabaseConfigured) return null;
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component — safe to ignore, middleware refreshes the session.
        }
      },
    },
  });
}
