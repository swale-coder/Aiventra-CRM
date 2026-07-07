"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavItemsForRole } from "@/lib/nav";
import { useAuth } from "@/lib/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export function IconRail() {
  const pathname = usePathname();
  const { role } = useAuth();
  const navItems = getNavItemsForRole(role);

  return (
    <aside className="fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 lg:block">
      <div className="glass flex max-h-[90vh] flex-col items-center gap-1 overflow-y-auto rounded-3xl p-2.5 shadow-lift no-scrollbar">
        <Link
          href="/dashboard"
          className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-aiventra-ink text-white"
          title="Aiventra AI"
        >
          <Sparkles size={18} className="text-aiventra-orange" />
        </Link>
        <div className="mb-1 h-px w-6 bg-black/10" />
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "group relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-200",
                active
                  ? "bg-aiventra-orange text-white shadow-glow"
                  : "text-aiventra-ink/60 hover:bg-black/[0.05] hover:text-aiventra-ink"
              )}
            >
              <Icon size={19} strokeWidth={2} />
              <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-aiventra-ink px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lift transition-opacity duration-150 group-hover:opacity-100">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
