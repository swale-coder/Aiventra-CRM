"use client";

import { useCrmData } from "@/lib/data/CrmDataProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertTriangle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConstructionStageStatus } from "@/lib/types";

const statusMeta: Record<ConstructionStageStatus, { icon: typeof CheckCircle2; color: string; tone: "green" | "orange" | "red" | "ink" }> = {
  Completed: { icon: CheckCircle2, color: "text-emerald-500 bg-emerald-50", tone: "green" },
  "In Progress": { icon: Clock, color: "text-aiventra-orange bg-aiventra-orange/10", tone: "orange" },
  Delayed: { icon: AlertTriangle, color: "text-red-500 bg-red-50", tone: "red" },
  Upcoming: { icon: Circle, color: "text-black/30 bg-black/[0.04]", tone: "ink" },
};

export function ConstructionTab() {
  const { projects, constructionStages } = useCrmData();

  if (projects.length === 0) {
    return <p className="py-10 text-center text-sm text-black/30">No projects yet.</p>;
  }

  return (
    <div className="space-y-5">
      {projects.map((p) => {
        const stages = constructionStages.filter((s) => s.project === p.name);
        const delayed = stages.filter((s) => s.status === "Delayed").length;

        return (
          <Card key={p.id}>
            <CardContent className="p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-display text-base font-semibold text-aiventra-ink">{p.name}</p>
                  <p className="text-xs text-black/40">{p.location}</p>
                </div>
                <div className="flex items-center gap-3">
                  {delayed > 0 && <Badge tone="red">{delayed} stage delayed</Badge>}
                  <div className="text-right">
                    <p className="font-display text-lg font-bold text-aiventra-ink">{p.constructionProgress}%</p>
                    <p className="text-[10px] text-black/40">Overall progress</p>
                  </div>
                </div>
              </div>
              <Progress value={p.constructionProgress} className="mb-5" />

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {stages.map((s) => {
                  const meta = statusMeta[s.status];
                  const Icon = meta.icon;
                  return (
                    <div key={s.id} className="rounded-xl border border-black/[0.06] p-3">
                      <div className={cn("mb-2 flex h-7 w-7 items-center justify-center rounded-full", meta.color)}>
                        <Icon size={13} />
                      </div>
                      <p className="text-xs font-medium leading-snug text-aiventra-ink">{s.stage}</p>
                      <p className="mt-1 text-[10px] text-black/40">
                        {s.status === "Completed"
                          ? `Done ${new Date(s.actualCompletionISO!).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                          : `Target ${new Date(s.plannedCompletionISO).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
                      </p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
                        <div
                          className={cn("h-full rounded-full", s.status === "Delayed" ? "bg-red-400" : s.status === "Completed" ? "bg-emerald-400" : "bg-aiventra-orange")}
                          style={{ width: `${s.progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
