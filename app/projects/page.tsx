"use client";

import { useState } from "react";
import { AppShell } from "@/components/shared/app-shell";
import { ProjectCard3D } from "@/components/dashboard/project-card-3d";
import { UnitHeatmap } from "@/components/dashboard/unit-heatmap";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useCrmData } from "@/lib/data/CrmDataProvider";
import { NewProjectDialog } from "@/components/shared/dialogs/new-project-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Building2, Users, TrendingUp, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function ProjectsPage() {
  const { organization } = useAuth();
  const { projects, units, loading } = useCrmData();
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = projects.find((p) => p.id === activeId) ?? projects[0] ?? null;
  const projectUnits = active ? units.filter((u) => u.projectId === active.id) : [];
  const towerLabels = active ? ["A", "B", "C", "D", "E"].slice(0, active.towers) : [];

  return (
    <AppShell>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-aiventra-ink">Project Intelligence</h1>
          <p className="text-sm text-black/45">
            {projects.length} active project{projects.length === 1 ? "" : "s"} · {organization.name}
          </p>
        </div>
        <NewProjectDialog
          trigger={
            <Button size="sm">
              <Plus size={14} /> New Project
            </Button>
          }
        />
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-black/30">
          <Loader2 className="animate-spin" size={22} />
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-black/30">No projects yet — create your first project to get started.</CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard3D key={p.id} project={p} onClick={() => setActiveId(p.id)} />
            ))}
          </div>

          {active && (
            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 size={15} className="text-aiventra-orange" /> {active.name} — Unit Availability
                  </CardTitle>
                  <Badge tone="orange">{active.totalUnits - active.soldUnits} available</Badge>
                </CardHeader>
                <CardContent>
                  <UnitHeatmap units={projectUnits} towers={towerLabels} />
                </CardContent>
              </Card>

              <div className="space-y-5">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Units</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    {projectUnits.filter((u) => u.status === "Sold").length === 0 && (
                      <p className="py-4 text-center text-xs text-black/30">No sold units yet.</p>
                    )}
                    {projectUnits
                      .filter((u) => u.status === "Sold")
                      .slice(0, 4)
                      .map((u) => (
                        <div key={u.id} className="flex items-center justify-between rounded-xl bg-black/[0.02] px-3 py-2.5 text-sm">
                          <div>
                            <p className="font-medium text-aiventra-ink">Unit {u.unitNo}</p>
                            <p className="text-xs text-black/40">
                              {u.config} · {u.facing}
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-emerald-600">{formatINR(u.price)}</span>
                        </div>
                      ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users size={15} className="text-aiventra-orange" /> Project Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <Row label="RERA ID" value={active.reraId || "—"} />
                    <Row label="Avg. ticket size" value={formatINR(active.avgTicketSize)} />
                    <Row label="Configurations" value={active.configurations.join(", ") || "—"} />
                    <Row label="Possession" value={active.possessionDate || "—"} />
                    <div className="flex items-center justify-between border-t border-black/[0.05] pt-3">
                      <span className="text-black/45">Construction progress</span>
                      <span className="flex items-center gap-1 font-semibold text-aiventra-ink">
                        <TrendingUp size={13} className="text-emerald-500" /> {active.constructionProgress}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="shrink-0 text-black/45">{label}</span>
      <span className="truncate text-right font-medium text-aiventra-ink">{value}</span>
    </div>
  );
}
