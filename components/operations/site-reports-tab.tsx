"use client";

import { useCrmData } from "@/lib/data/CrmDataProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, HardHat } from "lucide-react";

export function SiteReportsTab() {
  const { siteReports, orgUsers } = useCrmData();

  if (siteReports.length === 0) {
    return <p className="py-10 text-center text-sm text-black/30">No site reports yet.</p>;
  }

  return (
    <div className="space-y-4">
      {siteReports.map((r) => {
        const engineer = orgUsers.find((u) => u.id === r.engineer);
        return (
          <Card key={r.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {engineer && <Avatar name={engineer.name} color={engineer.avatarColor} size={38} />}
                  <div>
                    <p className="font-display text-base font-semibold text-aiventra-ink">{r.title}</p>
                    <p className="flex items-center gap-1.5 text-xs text-black/40">
                      <HardHat size={11} /> {engineer?.name} · {r.project} ·{" "}
                      {new Date(r.dateISO).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
                <Badge tone="orange">{r.progressNoted}% complete</Badge>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-black/60">{r.summary}</p>

              {r.issuesFlagged.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {r.issuesFlagged.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">
                      <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                      {issue}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
