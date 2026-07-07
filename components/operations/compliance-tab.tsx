"use client";

import { useCrmData } from "@/lib/data/CrmDataProvider";
import { Badge } from "@/components/ui/badge";
import { ComplianceStatus } from "@/lib/types";
import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";

const statusMeta: Record<ComplianceStatus, { icon: typeof ShieldCheck; tone: "green" | "amber" | "red"; color: string }> = {
  Compliant: { icon: ShieldCheck, tone: "green", color: "text-emerald-500 bg-emerald-50" },
  "Due Soon": { icon: ShieldAlert, tone: "amber", color: "text-amber-500 bg-amber-50" },
  Overdue: { icon: ShieldX, tone: "red", color: "text-red-500 bg-red-50" },
};

const order: ComplianceStatus[] = ["Overdue", "Due Soon", "Compliant"];

export function ComplianceTab() {
  const { complianceItems } = useCrmData();
  const sorted = [...complianceItems].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
  const overdueCount = complianceItems.filter((c) => c.status === "Overdue").length;

  if (complianceItems.length === 0) {
    return <p className="py-10 text-center text-sm text-black/30">No compliance items tracked yet.</p>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-black/45">{complianceItems.length} tracked requirements across all projects</p>
        {overdueCount > 0 && <Badge tone="red">{overdueCount} overdue</Badge>}
      </div>

      <div className="space-y-2.5">
        {sorted.map((c) => {
          const meta = statusMeta[c.status];
          const Icon = meta.icon;
          const daysLeft = Math.ceil((new Date(c.dueDateISO).getTime() - Date.now()) / 86400000);
          return (
            <div key={c.id} className="flex items-center gap-4 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-soft">
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", meta.color)}>
                <Icon size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-aiventra-ink">{c.requirement}</p>
                <p className="text-xs text-black/40">{c.project} · {c.authority}</p>
              </div>
              <div className="text-right">
                <p className={cn("text-xs font-medium", c.status === "Overdue" ? "text-red-500" : "text-black/50")}>
                  {daysLeft >= 0 ? `Due in ${daysLeft}d` : `${Math.abs(daysLeft)}d overdue`}
                </p>
                <Badge tone={meta.tone}>{c.status}</Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
