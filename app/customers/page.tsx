"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/shared/app-shell";
import { useCrmData } from "@/lib/data/CrmDataProvider";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatINR, timeAgo } from "@/lib/utils";
import { Sparkles, Phone, MessageCircle, Calendar, FileText, IndianRupee, Mail, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap = {
  call: Phone,
  visit: Calendar,
  whatsapp: MessageCircle,
  document: FileText,
  payment: IndianRupee,
  email: Mail,
};

const iconColor = {
  call: "bg-blue-50 text-blue-500",
  visit: "bg-violet-50 text-violet-500",
  whatsapp: "bg-emerald-50 text-emerald-500",
  document: "bg-amber-50 text-amber-500",
  payment: "bg-aiventra-orange/10 text-aiventra-orange",
  email: "bg-black/[0.05] text-black/50",
};

export default function CustomersPage() {
  const { customers, loading } = useCrmData();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      customers.filter((c) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) || c.interestedConfig.toLowerCase().includes(q);
      }),
    [customers, query]
  );

  const active = customers.find((c) => c.id === activeId) ?? filtered[0] ?? null;

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center text-black/30">
          <Loader2 className="animate-spin" size={22} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold text-aiventra-ink">Customer 360</h1>
        <p className="text-sm text-black/45">{customers.length} customer profiles with full interaction history</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Customer list */}
        <Card className="lg:col-span-1">
          <CardContent className="p-3">
            <div className="mb-2 flex items-center gap-2 rounded-xl bg-black/[0.03] px-3 py-2">
              <Search size={14} className="text-black/35" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search customers…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-black/35"
              />
            </div>
            <div className="space-y-1">
              {filtered.length === 0 && <p className="px-2.5 py-6 text-center text-xs text-black/30">No customers found.</p>}
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors",
                    active?.id === c.id ? "bg-aiventra-orange/[0.08]" : "hover:bg-black/[0.03]"
                  )}
                >
                  <Avatar name={c.name} color={c.avatarColor} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-aiventra-ink">{c.name}</p>
                    <p className="truncate text-xs text-black/40">
                      {c.interestedConfig} · {c.city}
                    </p>
                  </div>
                  <Badge tone={c.type === "Investor" ? "orange" : "ink"}>{c.type}</Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Profile detail */}
        <div className="space-y-5 lg:col-span-2">
          {!active ? (
            <Card>
              <CardContent className="p-10 text-center text-sm text-black/30">No customers yet.</CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar name={active.name} color={active.avatarColor} size={56} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-lg font-bold text-aiventra-ink">{active.name}</h2>
                        <Badge tone={active.type === "Investor" ? "orange" : "ink"}>{active.type}</Badge>
                      </div>
                      <p className="text-sm text-black/45">
                        {active.phone} · {active.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg font-bold text-aiventra-ink">{formatINR(active.budget)}</p>
                      <p className="text-xs text-black/40">Budget</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-gradient-to-br from-aiventra-orange/[0.06] to-transparent p-3.5">
                    <Sparkles size={15} className="mt-0.5 shrink-0 text-aiventra-orange" />
                    <p className="text-sm leading-relaxed text-[#8a4600]">{active.aiSummary || "No AI summary yet."}</p>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="rounded-xl bg-black/[0.02] py-2.5">
                      <p className="font-semibold text-aiventra-ink">{active.interestedConfig || "—"}</p>
                      <p className="text-black/40">Configuration</p>
                    </div>
                    <div className="rounded-xl bg-black/[0.02] py-2.5">
                      <p className="font-semibold text-aiventra-ink">{active.facingPreference || "—"}</p>
                      <p className="text-black/40">Facing pref.</p>
                    </div>
                    <div className="rounded-xl bg-black/[0.02] py-2.5">
                      <p className="font-semibold text-aiventra-ink">{active.city || "—"}</p>
                      <p className="text-black/40">Location</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <h3 className="mb-4 font-display text-base font-semibold text-aiventra-ink">Interaction Timeline</h3>
                  {active.timeline.length === 0 ? (
                    <p className="text-sm text-black/30">No interactions recorded yet.</p>
                  ) : (
                    <div className="relative space-y-5 pl-6">
                      <div className="absolute bottom-1 left-[11px] top-1 w-px bg-black/[0.08]" />
                      {active.timeline.map((ev) => {
                        const Icon = iconMap[ev.type];
                        return (
                          <div key={ev.id} className="relative">
                            <div
                              className={cn(
                                "absolute -left-6 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white",
                                iconColor[ev.type]
                              )}
                            >
                              <Icon size={12} />
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-aiventra-ink">{ev.title}</p>
                              <span className="text-[11px] text-black/35">{timeAgo(ev.dateISO)}</span>
                            </div>
                            <p className="mt-0.5 text-xs text-black/45">{ev.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
