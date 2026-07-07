"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { FormRow, FormGrid, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useCrmData } from "@/lib/data/CrmDataProvider";
import { Loader2 } from "lucide-react";

export function NewBookingDialog({ trigger }: { trigger: React.ReactNode }) {
  const { units, customers, orgUsers, createBooking } = useCrmData();
  const availableUnits = useMemo(() => units.filter((u) => u.status === "Available"), [units]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    unitId: "",
    customerId: customers[0]?.id ?? "",
    bookedBy: orgUsers[0]?.id ?? "",
    bookingAmount: "",
    tokenAmount: "",
    tokenPaid: true,
    brokerName: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSelectUnit(unitId: string) {
    const unit = units.find((u) => u.id === unitId);
    setForm((f) => ({ ...f, unitId, bookingAmount: unit ? String(unit.price) : f.bookingAmount }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.unitId || !form.customerId || !form.bookingAmount) return;
    setSaving(true);
    setError(null);
    try {
      await createBooking({
        unitId: form.unitId,
        customerId: form.customerId,
        bookedBy: form.bookedBy,
        bookingAmount: Number(form.bookingAmount),
        tokenAmount: Number(form.tokenAmount) || 0,
        tokenPaid: form.tokenPaid,
        brokerName: form.brokerName || undefined,
      });
      setOpen(false);
      setForm((f) => ({ ...f, unitId: "", bookingAmount: "", tokenAmount: "", brokerName: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create booking.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent title="New booking" description="Book an available unit for a customer. Payment milestones are generated automatically.">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <FormRow label="Available unit">
            <Select required value={form.unitId} onChange={(e) => onSelectUnit(e.target.value)}>
              <option value="">
                {availableUnits.length === 0 ? "No available units" : "— Select a unit —"}
              </option>
              {availableUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unitNo} · {u.config} · {u.areaSqft} sqft
                </option>
              ))}
            </Select>
          </FormRow>
          <FormRow label="Customer">
            <Select required value={form.customerId} onChange={(e) => set("customerId", e.target.value)}>
              <option value="">{customers.length === 0 ? "No customers yet" : "— Select customer —"}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FormRow>
          <FormGrid>
            <FormRow label="Booking amount (₹)">
              <Input required type="number" value={form.bookingAmount} onChange={(e) => set("bookingAmount", e.target.value)} />
            </FormRow>
            <FormRow label="Token amount (₹)">
              <Input type="number" value={form.tokenAmount} onChange={(e) => set("tokenAmount", e.target.value)} placeholder="250000" />
            </FormRow>
          </FormGrid>
          <FormGrid>
            <FormRow label="Booked by">
              <Select value={form.bookedBy} onChange={(e) => set("bookedBy", e.target.value)}>
                {orgUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </Select>
            </FormRow>
            <FormRow label="Broker (optional)">
              <Input value={form.brokerName} onChange={(e) => set("brokerName", e.target.value)} placeholder="Broker firm name" />
            </FormRow>
          </FormGrid>
          <label className="flex items-center gap-2 text-sm text-aiventra-ink">
            <input type="checkbox" checked={form.tokenPaid} onChange={(e) => set("tokenPaid", e.target.checked)} className="h-4 w-4 rounded accent-aiventra-orange" />
            Token amount already paid
          </label>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />} Create booking
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
