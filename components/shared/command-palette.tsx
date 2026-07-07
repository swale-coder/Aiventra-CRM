"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Sparkles } from "lucide-react";
import { navItems } from "@/lib/nav";
import { useCrmData } from "@/lib/data/CrmDataProvider";

const aiPrompts = [
  "Show hot leads for Skyline Heights",
  "Who is likely to close this week?",
  "Revenue forecast for July?",
  "Pending payments above 10 lakh?",
];

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { leads, projects, customers } = useCrmData();

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const q = query.toLowerCase().trim();
  const matchedLeads = q ? leads.filter((l) => l.name.toLowerCase().includes(q)).slice(0, 4) : [];
  const matchedProjects = q ? projects.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 3) : [];
  const matchedCustomers = q ? customers.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 3) : [];
  const matchedNav = q ? navItems.filter((n) => n.label.toLowerCase().includes(q)) : navItems;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content className="fixed left-1/2 top-[14%] z-[61] w-[92vw] max-w-xl -translate-x-1/2 overflow-hidden rounded-3xl border border-white/60 bg-white/95 shadow-lift backdrop-blur-xl">
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <div className="flex items-center gap-3 border-b border-black/[0.06] px-5 py-4">
            <Search size={18} className="text-black/40" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask Aiventra AI or search leads, projects, customers…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-black/35"
            />
            <kbd className="rounded-md border border-black/10 bg-black/[0.03] px-1.5 py-0.5 text-[10px] text-black/40">ESC</kbd>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {!q && (
              <div className="p-2">
                <p className="px-2 pb-2 pt-1 text-[11px] font-medium uppercase tracking-wide text-black/35">
                  Ask AI
                </p>
                {aiPrompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      router.push(`/assistant?q=${encodeURIComponent(p)}`);
                      onOpenChange(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-aiventra-ink hover:bg-aiventra-orange/[0.07]"
                  >
                    <Sparkles size={15} className="shrink-0 text-aiventra-orange" />
                    {p}
                  </button>
                ))}
              </div>
            )}

            {matchedNav.length > 0 && (
              <div className="p-2">
                <p className="px-2 pb-1 pt-1 text-[11px] font-medium uppercase tracking-wide text-black/35">Go to</p>
                {matchedNav.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => {
                      router.push(item.href);
                      onOpenChange(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm hover:bg-black/[0.04]"
                  >
                    <span className="flex items-center gap-3">
                      <item.icon size={15} className="text-black/40" />
                      {item.label}
                    </span>
                    <ArrowRight size={14} className="text-black/25" />
                  </button>
                ))}
              </div>
            )}

            {matchedLeads.length > 0 && (
              <div className="p-2">
                <p className="px-2 pb-1 pt-1 text-[11px] font-medium uppercase tracking-wide text-black/35">Leads</p>
                {matchedLeads.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => {
                      router.push("/leads");
                      onOpenChange(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm hover:bg-black/[0.04]"
                  >
                    <span>{l.name} <span className="text-black/35">· {l.interestedProject}</span></span>
                    <span className="text-xs font-medium text-aiventra-orange">{l.score}</span>
                  </button>
                ))}
              </div>
            )}

            {matchedProjects.length > 0 && (
              <div className="p-2">
                <p className="px-2 pb-1 pt-1 text-[11px] font-medium uppercase tracking-wide text-black/35">Projects</p>
                {matchedProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      router.push("/projects");
                      onOpenChange(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm hover:bg-black/[0.04]"
                  >
                    {p.name} <span className="text-black/35">{p.location}</span>
                  </button>
                ))}
              </div>
            )}

            {matchedCustomers.length > 0 && (
              <div className="p-2">
                <p className="px-2 pb-1 pt-1 text-[11px] font-medium uppercase tracking-wide text-black/35">Customers</p>
                {matchedCustomers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      router.push("/customers");
                      onOpenChange(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm hover:bg-black/[0.04]"
                  >
                    {c.name} <span className="text-black/35">{c.type}</span>
                  </button>
                ))}
              </div>
            )}

            {q && matchedLeads.length === 0 && matchedProjects.length === 0 && matchedCustomers.length === 0 && matchedNav.length === 0 && (
              <div className="p-8 text-center text-sm text-black/40">No results for &ldquo;{query}&rdquo;</div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
