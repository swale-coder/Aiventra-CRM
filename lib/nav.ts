import {
  LayoutGrid,
  KanbanSquare,
  Building2,
  Users,
  CalendarCheck2,
  UserSquare2,
  Sparkles,
  Receipt,
  Wallet,
  HardHat,
  Bot,
} from "lucide-react";
import type { Role } from "@/lib/types";

export const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "AI Assistant", href: "/assistant", icon: Bot },
  { label: "Leads", href: "/leads", icon: KanbanSquare },
  { label: "AI Insights", href: "/ai-insights", icon: Sparkles },
  { label: "Projects", href: "/projects", icon: Building2 },
  { label: "Operations", href: "/operations", icon: HardHat },
  { label: "Bookings", href: "/bookings", icon: Receipt },
  { label: "Finance", href: "/finance", icon: Wallet },
  { label: "Customers", href: "/customers", icon: UserSquare2 },
  { label: "Site Visits", href: "/site-visits", icon: CalendarCheck2 },
  { label: "Sales Team", href: "/sales-team", icon: Users },
];

/**
 * Organization-based / role-based access control (RBAC).
 * "*" means every route is visible. Owner and Admin always see everything.
 * Keep this in sync with the middleware's ROLE_ROUTE_ACCESS map in
 * lib/supabase/middleware.ts so nav visibility and actual route protection agree.
 */
export const ROLE_NAV_ACCESS: Record<Role, string[] | "*"> = {
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
  "Sales Executive": [
    "/dashboard",
    "/assistant",
    "/leads",
    "/ai-insights",
    "/customers",
    "/site-visits",
    "/bookings",
  ],
  "Site Engineer": ["/dashboard", "/operations", "/projects"],
};

export function getNavItemsForRole(role?: Role | null) {
  if (!role) return navItems;
  const allowed = ROLE_NAV_ACCESS[role];
  if (allowed === "*") return navItems;
  return navItems.filter((item) => allowed.includes(item.href));
}

export function canAccessRoute(role: Role | undefined | null, pathname: string): boolean {
  if (!role) return true; // demo mode / unresolved session — don't block
  const allowed = ROLE_NAV_ACCESS[role];
  if (allowed === "*") return true;
  // Always allow the shared/non-nav routes (dashboard, assistant, settings, etc.)
  return allowed.some((href) => pathname === href || pathname.startsWith(href + "/"));
}
