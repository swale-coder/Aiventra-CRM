"use client";

import { useState } from "react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { FormRow, FormGrid, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useCrmData } from "@/lib/data/CrmDataProvider";
import { Loader2 } from "lucide-react";

const ALL_CONFIGS = ["2BHK", "3BHK", "4BHK", "Penthouse"];

export function NewProjectDialog({ trigger }: { trigger: React.ReactNode }) {
  const { createProjectWithUnits } = useCrmData();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    location: "",
    towers: "2",
    floorsPerTower: "14",
    possessionDate: "",
    avgTicketSize: "10000000",
    reraId: "",
    configurations: ["2BHK", "3BHK"] as string[],
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleConfig(c: string) {
    setForm((f) => ({
      ...f,
      configurations: f.configurations.includes(c) ? f.configurations.filter((x) => x !== c) : [...f.configurations, c],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || form.configurations.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await createProjectWithUnits({
        name: form.name,
        location: form.location,
        towers: Number(form.towers) || 1,
        floorsPerTower: Number(form.floorsPerTower) || 1,
        possessionDate: form.possessionDate,
        avgTicketSize: Number(form.avgTicketSize) || 10000000,
        configurations: form.configurations,
        reraId: form.reraId,
      });
      setOpen(false);
      setForm((f) => ({ ...f, name: "", location: "", reraId: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create project.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent title="New project" description="Units are generated automatically for every tower and floor.">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <FormRow label="Project name">
            <Input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Skyline Vista" />
          </FormRow>
          <FormRow label="Location">
            <Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Gota, Ahmedabad" />
          </FormRow>
          <FormGrid>
            <FormRow label="Towers">
              <Input required type="number" min={1} max={5} value={form.towers} onChange={(e) => set("towers", e.target.value)} />
            </FormRow>
            <FormRow label="Floors per tower">
              <Input required type="number" min={1} value={form.floorsPerTower} onChange={(e) => set("floorsPerTower", e.target.value)} />
            </FormRow>
          </FormGrid>
          <FormGrid>
            <FormRow label="Possession date">
              <Input value={form.possessionDate} onChange={(e) => set("possessionDate", e.target.value)} placeholder="Dec 2028" />
            </FormRow>
            <FormRow label="Avg. ticket size (₹)">
              <Input type="number" value={form.avgTicketSize} onChange={(e) => set("avgTicketSize", e.target.value)} />
            </FormRow>
          </FormGrid>
          <FormRow label="RERA ID">
            <Input value={form.reraId} onChange={(e) => set("reraId", e.target.value)} placeholder="PR/GJ/..." />
          </FormRow>
          <FormRow label="Configurations">
            <div className="flex flex-wrap gap-2">
              {ALL_CONFIGS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => toggleConfig(c)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    form.configurations.includes(c) ? "bg-aiventra-ink text-white" : "bg-black/[0.05] text-black/50 hover:bg-black/[0.08]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </FormRow>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />} Create project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
