"use client";

import { useState } from "react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { FormRow, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useCrmData } from "@/lib/data/CrmDataProvider";
import { Loader2 } from "lucide-react";

const DOC_TYPES = ["RERA Certificate", "NOC", "Approval", "Structural Certificate", "Legal", "Other"];

export function UploadDocumentDialog({ trigger }: { trigger: React.ReactNode }) {
  const { projects, createDocument } = useCrmData();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", projectId: projects[0]?.id ?? "", docType: DOC_TYPES[0] });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createDocument({ name: form.name, projectId: form.projectId, docType: form.docType });
      setOpen(false);
      setForm((f) => ({ ...f, name: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add document record.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent title="Upload document" description="Register a compliance/legal document for a project.">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <FormRow label="Document name">
            <Input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Fire Safety NOC — Skyline Greens" />
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
          <FormRow label="Document type">
            <Select value={form.docType} onChange={(e) => set("docType", e.target.value)}>
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </FormRow>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />} Add document
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
