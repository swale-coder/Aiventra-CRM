"use client";

import { useState } from "react";
import { AppShell } from "@/components/shared/app-shell";
import { useCrmData } from "@/lib/data/CrmDataProvider";
import { ScheduleVisitDialog } from "@/components/shared/dialogs/schedule-visit-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Plus, MapPin, Clock, Loader2, Check, X, UserX } from "lucide-react";
import { cn } from "@/lib/utils";
import { SiteVisit } from "@/lib/types";

const statusTone: Record<SiteVisit["status"], "orange" | "green" | "red" | "amber"> = {
  Scheduled: "orange",
  Completed: "green",
  Cancelled: "red",
  "No Show": "amber",
};

const filters: (SiteVisit["status"] | "All")[] = ["All", "Scheduled", "Completed", "No Show", "Cancelled"];

export default function SiteVisitsPage() {
  const { siteVisits, loading, updateSiteVisitStatus } = useCrmData();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const visible = filter === "All" ? siteVisits : siteVisits.filter((v) => v.status === filter);

  return (
    <AppShell>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-aiventra-ink">Site Visits</h1>
          <p className="text-sm text-black/45">{siteVisits.filter((v) => v.status === "Scheduled").length} upcoming visits</p>
        </div>
        <ScheduleVisitDialog
          trigger={
            <Button size="sm">
              <Plus size={14} /> Schedule Visit
            </Button>
          }
        />
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "shrink-0 rounded-xl px-3.5 py-2 text-xs font-medium transition-colors",
              filter === f ? "bg-aiventra-ink text-white" : "bg-white border border-black/[0.08] text-black/50 hover:bg-black/[0.03]"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-black/30">
          <Loader2 className="animate-spin" size={22} />
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-black/30">No visits in this view.</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((v) => (
            <Card key={v.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={v.leadName} size={38} color="#FF6B00" />
                    <div>
                      <p className="text-sm font-semibold text-aiventra-ink">{v.leadName}</p>
                      <p className="flex items-center gap-1 text-xs text-black/40">
                        <MapPin size={11} /> {v.project}
                      </p>
                    </div>
                  </div>
                  <Badge tone={statusTone[v.status]}>{v.status}</Badge>
                </div>

                <div className="mt-3.5 flex items-center gap-1.5 text-xs text-black/50">
                  <Clock size={12} />
                  {new Date(v.dateISO).toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>

                {v.notes && <p className="mt-3 rounded-lg bg-black/[0.03] p-2.5 text-xs leading-relaxed text-black/55">{v.notes}</p>}

                <div className="mt-3.5 flex items-center justify-between border-t border-black/[0.05] pt-3 text-xs">
                  <span className="text-black/40">Assigned to</span>
                  <span className="font-medium text-aiventra-ink">{v.assignedTo}</span>
                </div>

                {v.status === "Scheduled" && (
                  <div className="mt-3 flex gap-1.5 border-t border-black/[0.05] pt-3">
                    <button
                      onClick={() => updateSiteVisitStatus(v.id, "Completed")}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-50 py-1.5 text-[11px] font-medium text-emerald-600 hover:bg-emerald-100"
                    >
                      <Check size={11} /> Completed
                    </button>
                    <button
                      onClick={() => updateSiteVisitStatus(v.id, "No Show")}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-amber-50 py-1.5 text-[11px] font-medium text-amber-600 hover:bg-amber-100"
                    >
                      <UserX size={11} /> No show
                    </button>
                    <button
                      onClick={() => updateSiteVisitStatus(v.id, "Cancelled")}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-50 py-1.5 text-[11px] font-medium text-red-500 hover:bg-red-100"
                    >
                      <X size={11} /> Cancel
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
