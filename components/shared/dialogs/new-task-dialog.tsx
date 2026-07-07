"use client";

import { useState } from "react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { FormRow, FormGrid, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useCrmData } from "@/lib/data/CrmDataProvider";
import { Loader2 } from "lucide-react";

export function NewTaskDialog({ trigger }: { trigger: React.ReactNode }) {
  const { projects, orgUsers, createTask } = useCrmData();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    projectId: projects[0]?.id ?? "",
    assignedTo: orgUsers[0]?.id ?? "",
    dueDate: "",
    priority: "Medium" as "Low" | "Medium" | "High",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.dueDate) return;
    setSaving(true);
    setError(null);
    try {
      await createTask({
        title: form.title,
        projectId: form.projectId,
        assignedTo: form.assignedTo,
        dueDate: new Date(form.dueDate).toISOString(),
        priority: form.priority,
      });
      setOpen(false);
      setForm((f) => ({ ...f, title: "", dueDate: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create task.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent title="New task" description="Assign a construction or operations task.">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <FormRow label="Task title">
            <Input required value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Inspect plastering — Tower B" />
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
            <FormRow label="Assign to">
              <Select value={form.assignedTo} onChange={(e) => set("assignedTo", e.target.value)}>
                {orgUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </Select>
            </FormRow>
            <FormRow label="Priority">
              <Select value={form.priority} onChange={(e) => set("priority", e.target.value as "Low" | "Medium" | "High")}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </Select>
            </FormRow>
          </FormGrid>
          <FormRow label="Due date">
            <Input required type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
          </FormRow>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />} Create task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
