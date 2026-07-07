"use client";

import { useState } from "react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { FormRow, FormGrid, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import type { Role } from "@/lib/types";

const ROLES: Role[] = ["Admin", "Sales Manager", "Sales Executive", "Site Engineer"];

export function InviteMemberDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "Sales Executive" as Role });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/org/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't send invite.");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send invite.");
    } finally {
      setSaving(false);
    }
  }

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) {
      setSent(false);
      setError(null);
      setForm({ name: "", email: "", role: "Sales Executive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent title="Invite team member" description="They'll get an email invite to join your organization.">
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 size={32} className="text-emerald-500" />
            <p className="text-sm text-aiventra-ink">Invite sent to {form.email}.</p>
            <Button size="sm" variant="outline" onClick={() => handleOpenChange(false)}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <FormRow label="Name">
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Full name" />
            </FormRow>
            <FormGrid>
              <FormRow label="Email">
                <Input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="name@example.com" />
              </FormRow>
              <FormRow label="Role">
                <Select value={form.role} onChange={(e) => set("role", e.target.value as Role)}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </FormRow>
            </FormGrid>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving && <Loader2 size={14} className="animate-spin" />} Send invite
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
