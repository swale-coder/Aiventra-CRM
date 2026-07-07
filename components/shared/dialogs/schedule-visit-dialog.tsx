"use client";

import { useState } from "react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { FormRow, FormGrid, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useCrmData } from "@/lib/data/CrmDataProvider";
import { Loader2 } from "lucide-react";

export function ScheduleVisitDialog({ trigger }: { trigger: React.ReactNode }) {
  const { leads, projects, orgUsers, createSiteVisit } = useCrmData();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    leadId: leads[0]?.id ?? "",
    projectId: projects[0]?.id ?? "",
    date: "",
    time: "11:00",
    assignedTo: orgUsers[0]?.id ?? "",
    notes: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date) return;
    setSaving(true);
    setError(null);
    try {
      const scheduledAt = new Date(`${form.date}T${form.time}:00`).toISOString();
      await createSiteVisit({
        leadId: form.leadId,
        projectId: form.projectId,
        scheduledAt,
        assignedTo: form.assignedTo,
        notes: form.notes || undefined,
      });
      setOpen(false);
      setForm((f) => ({ ...f, date: "", notes: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't schedule visit.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent title="Schedule site visit" description="Book a site visit for a lead.">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <FormRow label="Lead">
            <Select value={form.leadId} onChange={(e) => set("leadId", e.target.value)}>
              {leads.length === 0 && <option value="">No leads yet</option>}
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </FormRow>
          <FormRow label="Project">
            <Select value={form.projectId} onChange={(e) => set("projectId", e.target.value)}>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </FormRow>
          <FormGrid>
            <FormRow label="Date">
              <Input required type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
            </FormRow>
            <FormRow label="Time">
              <Input required type="time" value={form.time} onChange={(e) => set("time", e.target.value)} />
            </FormRow>
          </FormGrid>
          <FormRow label="Assign to">
            <Select value={form.assignedTo} onChange={(e) => set("assignedTo", e.target.value)}>
              {orgUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} · {u.role}
                </option>
              ))}
            </Select>
          </FormRow>
          <FormRow label="Notes (optional)">
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Anything the team should know…" />
          </FormRow>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />} Schedule visit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
