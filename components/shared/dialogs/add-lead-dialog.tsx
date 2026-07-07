"use client";

import { useState } from "react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { FormRow, FormGrid, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useCrmData } from "@/lib/data/CrmDataProvider";
import { Loader2 } from "lucide-react";

const sources = ["Website", "Referral", "Walk-in", "99acres", "MagicBricks", "Instagram Ads", "Broker"] as const;

export function AddLeadDialog({ trigger }: { trigger: React.ReactNode }) {
  const { projects, orgUsers, createLead } = useCrmData();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    source: "Website" as (typeof sources)[number],
    budgetMin: "",
    budgetMax: "",
    interestedProjectId: projects[0]?.id ?? "",
    configPreference: "2BHK",
    assignedTo: orgUsers[0]?.id ?? "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createLead({
        name: form.name,
        phone: form.phone,
        email: form.email,
        city: form.city,
        source: form.source,
        budgetMin: Number(form.budgetMin) || 0,
        budgetMax: Number(form.budgetMax) || 0,
        interestedProjectId: form.interestedProjectId,
        configPreference: form.configPreference,
        assignedTo: form.assignedTo,
      });
      setOpen(false);
      setForm((f) => ({ ...f, name: "", phone: "", email: "", city: "", budgetMin: "", budgetMax: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create lead.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent title="Add lead" description="Create a new lead in your pipeline.">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <FormRow label="Name">
            <Input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Full name" />
          </FormRow>
          <FormGrid>
            <FormRow label="Phone">
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 ..." />
            </FormRow>
            <FormRow label="Email">
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="name@example.com" />
            </FormRow>
          </FormGrid>
          <FormGrid>
            <FormRow label="City">
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Ahmedabad" />
            </FormRow>
            <FormRow label="Source">
              <Select value={form.source} onChange={(e) => set("source", e.target.value as (typeof sources)[number])}>
                {sources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </FormRow>
          </FormGrid>
          <FormGrid>
            <FormRow label="Budget min (₹)">
              <Input type="number" value={form.budgetMin} onChange={(e) => set("budgetMin", e.target.value)} placeholder="9000000" />
            </FormRow>
            <FormRow label="Budget max (₹)">
              <Input type="number" value={form.budgetMax} onChange={(e) => set("budgetMax", e.target.value)} placeholder="12000000" />
            </FormRow>
          </FormGrid>
          <FormGrid>
            <FormRow label="Interested project">
              <Select value={form.interestedProjectId} onChange={(e) => set("interestedProjectId", e.target.value)}>
                <option value="">— None —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </FormRow>
            <FormRow label="Configuration">
              <Select value={form.configPreference} onChange={(e) => set("configPreference", e.target.value)}>
                {["2BHK", "3BHK", "4BHK", "Penthouse"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </FormRow>
          </FormGrid>
          <FormRow label="Assign to">
            <Select value={form.assignedTo} onChange={(e) => set("assignedTo", e.target.value)}>
              <option value="">— Unassigned —</option>
              {orgUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} · {u.role}
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
              {saving && <Loader2 size={14} className="animate-spin" />} Create lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
