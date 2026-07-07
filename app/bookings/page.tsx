"use client";

import { useState } from "react";
import { AppShell } from "@/components/shared/app-shell";
import { useCrmData } from "@/lib/data/CrmDataProvider";
import { NewBookingDialog } from "@/components/shared/dialogs/new-booking-dialog";
import { predictPaymentRisk } from "@/lib/ai/payment-risk";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatINR } from "@/lib/utils";
import { Plus, CheckCircle2, Clock, AlertTriangle, ChevronDown, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MilestoneStatus } from "@/lib/types";

const statusIcon: Record<MilestoneStatus, typeof CheckCircle2> = {
  Paid: CheckCircle2,
  Pending: Clock,
  Overdue: AlertTriangle,
};

const statusColor: Record<MilestoneStatus, string> = {
  Paid: "text-emerald-500 bg-emerald-50",
  Pending: "text-black/40 bg-black/[0.05]",
  Overdue: "text-red-500 bg-red-50",
};

const riskTone: Record<string, "green" | "amber" | "red"> = { Low: "green", Medium: "amber", High: "red" };

export default function BookingsPage() {
  const { bookings, loading } = useCrmData();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <AppShell>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-aiventra-ink">Booking Management</h1>
          <p className="text-sm text-black/45">{bookings.length} active bookings · payment milestones & token tracking</p>
        </div>
        <NewBookingDialog
          trigger={
            <Button size="sm">
              <Plus size={14} /> New Booking
            </Button>
          }
        />
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-black/30">
          <Loader2 className="animate-spin" size={22} />
        </div>
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-black/30">No bookings yet — create one from an available unit.</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
          const paidAmount = b.milestones.filter((m) => m.status === "Paid").reduce((s, m) => s + m.amount, 0);
          const pct = Math.round((paidAmount / b.bookingAmount) * 100);
          const risk = predictPaymentRisk(b);
          const isOpen = expanded === b.id;

          return (
            <Card key={b.id}>
              <CardContent className="p-5">
                <button className="flex w-full items-center justify-between gap-4 text-left" onClick={() => setExpanded(isOpen ? null : b.id)}>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-base font-semibold text-aiventra-ink">{b.customerName}</p>
                      <Badge tone="ink">{b.projectName} · {b.unitNo}</Badge>
                      {b.brokerName && <Badge tone="orange">via {b.brokerName}</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-black/40">
                      Booked {new Date(b.bookingDateISO).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} ·
                      Token {formatINR(b.tokenAmount)} {b.tokenPaid && "· paid"}
                    </p>
                  </div>

                  <div className="hidden text-right sm:block">
                    <p className="font-display text-base font-bold text-aiventra-ink">{formatINR(b.bookingAmount)}</p>
                    <p className="text-[11px] text-black/40">Total value</p>
                  </div>

                  <Badge tone={riskTone[risk.tier]}>{risk.tier} risk</Badge>
                  <ChevronDown size={16} className={cn("shrink-0 text-black/30 transition-transform", isOpen && "rotate-180")} />
                </button>

                <div className="mt-3 flex items-center gap-3">
                  <Progress value={pct} className="flex-1" />
                  <span className="shrink-0 text-xs font-medium text-black/50">{pct}% collected</span>
                </div>

                {isOpen && (
                  <div className="mt-5 grid grid-cols-1 gap-5 border-t border-black/[0.06] pt-5 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-black/35">Payment milestones</p>
                      <div className="space-y-2.5">
                        {b.milestones.map((m) => {
                          const Icon = statusIcon[m.status];
                          return (
                            <div key={m.id} className="flex items-center gap-3 rounded-xl bg-black/[0.015] p-3">
                              <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", statusColor[m.status])}>
                                <Icon size={14} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-aiventra-ink">{m.label}</p>
                                <p className="text-xs text-black/40">
                                  Due {new Date(m.dueDateISO).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-aiventra-ink">{formatINR(m.amount)}</p>
                                <Badge tone={m.status === "Paid" ? "green" : m.status === "Overdue" ? "red" : "ink"}>{m.status}</Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-black/35">
                        <Sparkles size={12} className="text-aiventra-orange" /> AI Payment Default Risk
                      </p>
                      <div className="rounded-2xl border border-black/[0.06] p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="font-display text-2xl font-bold text-aiventra-ink">{risk.riskScore}</span>
                          <Badge tone={riskTone[risk.tier]}>{risk.tier} risk</Badge>
                        </div>
                        <div className="space-y-2.5">
                          {risk.factors.map((f) => (
                            <div key={f.label}>
                              <div className="mb-1 flex items-center justify-between text-[11px]">
                                <span className="text-black/50">{f.label}</span>
                                <span className="text-black/35">{f.description}</span>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
                                <div
                                  className={cn("h-full rounded-full", f.normalized >= 60 ? "bg-red-400" : f.normalized >= 30 ? "bg-amber-400" : "bg-emerald-400")}
                                  style={{ width: `${f.normalized}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        </div>
      )}
    </AppShell>
  );
}
