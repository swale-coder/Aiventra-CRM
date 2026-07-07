"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavItemsForRole } from "@/lib/nav";
import { useAuth } from "@/lib/auth/AuthProvider";
import { cn } from "@/lib/utils";

export function MobileDock() {
  const pathname = usePathname();
  const { role } = useAuth();
  const navItems = getNavItemsForRole(role);
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 lg:hidden">
      <div className="glass flex items-center justify-around rounded-2xl px-1 py-2 shadow-lift">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-medium transition-colors",
                active ? "text-aiventra-orange" : "text-aiventra-ink/50"
              )}
            >
              <Icon size={18} />
              {item.label.split(" ")[0]}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
