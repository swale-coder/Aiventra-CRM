"use client";

import { useEffect, useState } from "react";
import { Search, Bell, ChevronDown, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ActivityIsland } from "@/components/shared/activity-island";
import { useAuth } from "@/lib/auth/AuthProvider";

export function TopHeader({ onOpenPalette }: { onOpenPalette: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { orgUser, organization, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut();
  }

  if (!orgUser) return null;

  return (
    <header
      className={cn(
        "sticky top-0 z-30 transition-all duration-300",
        scrolled ? "glass shadow-soft" : "bg-transparent"
      )}
    >
      <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-5 py-3.5 lg:pl-24 lg:pr-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-aiventra-ink font-display text-sm font-bold text-white">
            {organization.logoInitial}
          </div>
          <div className="hidden min-w-0 flex-col sm:flex">
            <span className="truncate font-display text-sm font-semibold leading-tight text-aiventra-ink">
              {organization.name}
            </span>
            <span className="truncate text-[11px] leading-tight text-black/40">{organization.city}</span>
          </div>
          <ChevronDown size={14} className="hidden text-black/30 sm:block" />
        </div>

        <div className="hidden flex-1 justify-center md:flex">
          <ActivityIsland />
        </div>

        <button
          onClick={onOpenPalette}
          className="ml-auto flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white/70 px-3 py-2 text-sm text-black/40 shadow-soft transition-colors hover:border-black/15 hover:text-black/60"
        >
          <Search size={15} />
          <span className="hidden sm:inline">Ask Aiventra…</span>
          <kbd className="ml-1 hidden rounded-md border border-black/10 bg-black/[0.03] px-1.5 py-0.5 text-[10px] sm:inline">⌘K</kbd>
        </button>

        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl text-black/50 transition-colors hover:bg-black/[0.05]">
          <Bell size={17} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-aiventra-orange" />
        </button>

        <div className="relative">
          <button onClick={() => setMenuOpen((o) => !o)}>
            <Avatar name={orgUser.name} color={orgUser.avatarColor} size={34} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-11 z-20 w-48 rounded-xl border border-black/[0.06] bg-white p-1.5 shadow-lift">
                <div className="px-2.5 py-2">
                  <p className="truncate text-sm font-medium text-aiventra-ink">{orgUser.name}</p>
                  <p className="truncate text-xs text-black/40">{orgUser.email}</p>
                  <p className="mt-1 inline-block rounded-full bg-aiventra-orange/10 px-2 py-0.5 text-[10px] font-medium text-aiventra-orange">{orgUser.role}</p>
                </div>
                <div className="my-1 h-px bg-black/[0.06]" />
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
