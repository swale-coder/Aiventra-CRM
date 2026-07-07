"use client";

import { useState } from "react";
import { AppShell } from "@/components/shared/app-shell";
import { LeadCard } from "@/components/leads/lead-card";
import { useCrmData } from "@/lib/data/CrmDataProvider";
import { LeadStage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { AddLeadDialog } from "@/components/shared/dialogs/add-lead-dialog";
import { Plus, SlidersHorizontal, LayoutGrid, List, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const stages: { key: LeadStage; label: string; tone: string }[] = [
  { key: "New", label: "New", tone: "bg-black/[0.35]" },
  { key: "Contacted", label: "Contacted", tone: "bg-blue-400" },
  { key: "Interested", label: "Interested", tone: "bg-violet-400" },
  { key: "Visit Scheduled", label: "Visit Scheduled", tone: "bg-amber-400" },
  { key: "Negotiation", label: "Negotiation", tone: "bg-aiventra-orange" },
  { key: "Won", label: "Won", tone: "bg-emerald-500" },
];

export default function LeadsPage() {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const { leads: allLeads, projects, loading, updateLeadStage } = useCrmData();

  return (
    <AppShell>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-aiventra-ink">Lead OS</h1>
          <p className="text-sm text-black/45">
            {allLeads.length} leads across {projects.length} active project{projects.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-black/[0.08] bg-white p-1">
            <button
              onClick={() => setView("kanban")}
              className={cn("flex h-7 w-7 items-center justify-center rounded-lg", view === "kanban" ? "bg-aiventra-ink text-white" : "text-black/40")}
            >
              <LayoutGrid size={13} />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn("flex h-7 w-7 items-center justify-center rounded-lg", view === "list" ? "bg-aiventra-ink text-white" : "text-black/40")}
            >
              <List size={13} />
            </button>
          </div>
          <Button variant="outline" size="sm">
            <SlidersHorizontal size={14} /> Filters
          </Button>
          <AddLeadDialog
            trigger={
              <Button size="sm">
                <Plus size={14} /> Add Lead
              </Button>
            }
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-black/30">
          <Loader2 className="animate-spin" size={22} />
        </div>
      ) : view === "kanban" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const stageLeads = allLeads.filter((l) => l.stage === stage.key);
            return (
              <div key={stage.key} className="w-[280px] shrink-0">
                <div className="mb-3 flex items-center gap-2 px-1">
                  <span className={cn("h-2 w-2 rounded-full", stage.tone)} />
                  <h3 className="text-sm font-semibold text-aiventra-ink">{stage.label}</h3>
                  <span className="ml-auto rounded-full bg-black/[0.05] px-2 py-0.5 text-[11px] font-medium text-black/45">
                    {stageLeads.length}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {stageLeads.map((lead, i) => (
                    <LeadCard key={lead.id} lead={lead} index={i} />
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-black/10 p-6 text-center text-xs text-black/30">
                      No leads
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-soft">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/[0.06] bg-black/[0.02] text-xs text-black/40">
              <tr>
                <th className="px-4 py-3 font-medium">Lead</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Budget</th>
                <th className="px-4 py-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {allLeads.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-black/30">
                    No leads yet — add your first lead to get started.
                  </td>
                </tr>
              )}
              {allLeads.map((l) => (
                <tr key={l.id} className="border-b border-black/[0.04] last:border-0 hover:bg-black/[0.015]">
                  <td className="px-4 py-3 font-medium text-aiventra-ink">{l.name}</td>
                  <td className="px-4 py-3 text-black/60">{l.interestedProject}</td>
                  <td className="px-4 py-3 text-black/60">
                    <select
                      value={l.stage}
                      onChange={(e) => updateLeadStage(l.id, e.target.value as LeadStage)}
                      className="rounded-lg border border-black/10 bg-transparent px-2 py-1 text-xs text-black/70 outline-none focus:border-aiventra-orange/50"
                    >
                      {stages.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 font-semibold text-aiventra-orange">{l.score}</td>
                  <td className="px-4 py-3 text-black/60">₹{(l.budgetMax / 10000000).toFixed(1)}Cr</td>
                  <td className="px-4 py-3 text-black/60">{l.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
