"use client";

import { AppShell } from "@/components/shared/app-shell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ConstructionTab } from "@/components/operations/construction-tab";
import { TasksTab } from "@/components/operations/tasks-tab";
import { SiteReportsTab } from "@/components/operations/site-reports-tab";
import { DocumentsTab } from "@/components/operations/documents-tab";
import { ComplianceTab } from "@/components/operations/compliance-tab";

export default function OperationsPage() {
  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold text-aiventra-ink">Builder Operations</h1>
        <p className="text-sm text-black/45">Phase 4 — construction, tasks, site reports, documents & compliance</p>
      </div>

      <Tabs defaultValue="construction">
        <TabsList>
          <TabsTrigger value="construction">Construction</TabsTrigger>
          <TabsTrigger value="tasks">Team Tasks</TabsTrigger>
          <TabsTrigger value="reports">Site Reports</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="construction">
          <ConstructionTab />
        </TabsContent>
        <TabsContent value="tasks">
          <TasksTab />
        </TabsContent>
        <TabsContent value="reports">
          <SiteReportsTab />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsTab />
        </TabsContent>
        <TabsContent value="compliance">
          <ComplianceTab />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
