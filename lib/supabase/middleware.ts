import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } from "./config";
import type { Role } from "@/lib/types";

const PUBLIC_PATHS = ["/", "/signup", "/onboarding", "/auth/callback"];
const AUTH_ONLY_PATHS = ["/", "/signup"]; // signed-in users get bounced away from these

/**
 * Mirrors lib/nav.ts ROLE_NAV_ACCESS. Kept separate (rather than imported) so the
 * middleware — which runs on the Edge runtime — has zero dependency on client
 * component code. Update both maps together when adding a role or route.
 */
const ROLE_ROUTE_ACCESS: Record<Role, string[] | "*"> = {
  Owner: "*",
  Admin: "*",
  "Sales Manager": [
    "/dashboard",
    "/assistant",
    "/leads",
    "/ai-insights",
    "/projects",
    "/bookings",
    "/finance",
    "/customers",
    "/site-visits",
    "/sales-team",
  ],
  "Sales Executive": ["/dashboard", "/assistant", "/leads", "/ai-insights", "/customers", "/site-visits", "/bookings"],
  "Site Engineer": ["/dashboard", "/operations", "/projects"],
};

function isAllowed(role: Role, path: string) {
  const allowed = ROLE_ROUTE_ACCESS[role];
  if (allowed === "*") return true;
  return allowed.some((href) => path === href || path.startsWith(href + "/"));
}

/**
 * Refreshes the Supabase auth session on every request, enforces route
 * protection, and enforces organization/role-based access control.
 * In demo mode (no Supabase project connected yet) this is a no-op passthrough.
 */
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith("/api/"));

  // 1. Session expired / never logged in -> bounce to login, preserving destination.
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("redirectTo", path);
    return NextResponse.redirect(url);
  }

  // 2. Already signed in -> don't show the login/signup screens again.
  if (user && AUTH_ONLY_PATHS.some((p) => path === p)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user) {
    // 3. Organization-based access: resolve org membership + role for this user.
    const { data: orgUser } = await supabase
      .from("org_users")
      .select("role, active")
      .eq("user_id", user.id)
      .eq("active", true)
      .limit(1)
      .maybeSingle();

    if (!orgUser && path !== "/onboarding" && !isPublic) {
      // Authenticated but hasn't created/joined an organization yet.
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (orgUser && path === "/onboarding") {
      // Already onboarded — no need to see the wizard again.
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }

    // 4. User roles: block navigation to modules this role doesn't have access to.
    if (orgUser && !isPublic && !isAllowed(orgUser.role as Role, path)) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
