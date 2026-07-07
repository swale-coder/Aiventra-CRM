import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Role } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

export interface SessionOrgUser {
  id: string;
  orgId: string;
  userId: string;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  active: boolean;
}

export interface SessionOrganization {
  id: string;
  name: string;
  legalName: string | null;
  gstin: string | null;
  reraId: string | null;
  city: string | null;
  foundedYear: number | null;
}

export interface AppSession {
  user: User;
  orgUser: SessionOrgUser;
  organization: SessionOrganization;
}

/**
 * Returns the raw Supabase auth user for the current request, or null if
 * there's no session (or Supabase isn't connected yet — demo mode).
 */
export async function getServerUser(): Promise<User | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Resolves the full app session for the current request: the auth user,
 * their org membership row (with role), and the organization they belong to.
 * Every table read/write in the app should be scoped using session.orgUser.orgId.
 *
 * Returns null when: not authenticated, Supabase isn't configured (demo mode),
 * or the user has authenticated but hasn't completed onboarding yet (no
 * org_users row).
 */
export async function getAppSession(): Promise<AppSession | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("org_users")
    .select(
      "id, org_id, user_id, name, email, role, phone, active, organizations ( id, name, legal_name, gstin, rera_id, city, founded_year )"
    )
    .eq("user_id", user.id)
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const org = Array.isArray(data.organizations) ? data.organizations[0] : data.organizations;
  if (!org) return null;

  return {
    user,
    orgUser: {
      id: data.id,
      orgId: data.org_id,
      userId: data.user_id,
      name: data.name,
      email: data.email,
      role: data.role as Role,
      phone: data.phone,
      active: data.active,
    },
    organization: {
      id: org.id,
      name: org.name,
      legalName: org.legal_name,
      gstin: org.gstin,
      reraId: org.rera_id,
      city: org.city,
      foundedYear: org.founded_year,
    },
  };
}

/**
 * Server Component / Server Action guard: redirects to the login page if
 * there's no authenticated user, or to /onboarding if the user hasn't
 * joined/created an organization yet. Returns the resolved session otherwise.
 *
 * In demo mode (Supabase not configured) this is a no-op — callers should
 * fall back to mock data.
 */
export async function requireAppSession(): Promise<AppSession | null> {
  if (!isSupabaseConfigured) return null;

  const user = await getServerUser();
  if (!user) redirect("/");

  const session = await getAppSession();
  if (!session) redirect("/onboarding");

  return session;
}

/** Throws-free role check helper, safe to use in both server and client code. */
export function hasRole(role: Role | undefined, allowed: Role[]): boolean {
  if (!role) return false;
  return allowed.includes(role);
}

/** Redirects home if the current session's role isn't in `allowed`. Owner/Admin always pass. */
export async function requireRole(allowed: Role[]): Promise<AppSession | null> {
  const session = await requireAppSession();
  if (!session) return null;
  if (session.orgUser.role === "Owner" || session.orgUser.role === "Admin") return session;
  if (!hasRole(session.orgUser.role, allowed)) redirect("/dashboard");
  return session;
}
