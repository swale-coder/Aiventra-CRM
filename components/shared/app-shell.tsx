"use client";

import { useEffect, useState } from "react";
import { IconRail } from "@/components/shared/icon-rail";
import { MobileDock } from "@/components/shared/mobile-dock";
import { TopHeader } from "@/components/shared/top-header";
import { AiOrb } from "@/components/shared/ai-orb";
import { CommandPalette } from "@/components/shared/command-palette";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-aiventra-bg">
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(600px circle at 15% -10%, rgba(255,107,0,0.08), transparent 60%), radial-gradient(500px circle at 90% 10%, rgba(255,107,0,0.05), transparent 60%)",
        }}
      />
      <IconRail />
      <TopHeader onOpenPalette={() => setPaletteOpen(true)} />
      <main className="mx-auto max-w-[1400px] px-4 pb-28 pt-5 sm:px-6 lg:pl-24 lg:pr-8">{children}</main>
      <MobileDock />
      <AiOrb />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
