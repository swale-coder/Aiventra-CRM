"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/shared/app-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCrmData } from "@/lib/data/CrmDataProvider";
import { pendingDuesSummary, getAutoReminders } from "@/lib/ai/payment-risk";
import { formatINR, cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { IndianRupee, AlertCircle, Bell, Users, TrendingUp, Loader2, Send } from "lucide-react";

const windows = [
  { key: "7d", label: "Next 7 days" },
  { key: "month", label: "Next month" },
  { key: "quarter", label: "Next quarter" },
] as const;

export default function FinancePage() {
  const { bookings, brokerCommissions, revenueForecast, kpis, loading: dataLoading } = useCrmData();
  const [win, setWin] = useState<(typeof windows)[number]["key"]>("month");
  const dues = useMemo(() => pendingDuesSummary(bookings), [bookings]);
  const reminders = useMemo(() => getAutoReminders(bookings), [bookings]);

  const series =
    win === "7d" ? revenueForecast.next7DaysSeries : win === "month" ? revenueForecast.nextMonthSeries : revenueForecast.nextQuarterSeries;
  const total = win === "7d" ? revenueForecast.next7Days : win === "month" ? revenueForecast.nextMonth : revenueForecast.nextQuarter;

  const totalCommissionsPending = brokerCommissions.filter((c) => c.status === "Pending").reduce((s, c) => s + c.commissionAmount, 0);

  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold text-aiventra-ink">Financial System</h1>
        <p className="text-sm text-black/45">Phase 3 — bookings, collections, forecasting & broker payouts</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <FinKpi label="Collected this month" value={formatINR(kpis.monthlyRevenue)} icon={IndianRupee} tone="orange" />
        <FinKpi label="Pending dues" value={formatINR(dues.pending)} icon={AlertCircle} />
        <FinKpi label="Overdue amount" value={formatINR(dues.overdue)} icon={Bell} accent="text-red-500" />
        <FinKpi label="Broker payouts pending" value={formatINR(totalCommissionsPending)} icon={Users} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Revenue Forecast */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={15} className="text-aiventra-orange" /> AI Revenue Forecast
            </CardTitle>
            <div className="flex gap-1 rounded-lg border border-black/[0.08] bg-white p-1">
              {windows.map((w) => (
                <button
                  key={w.key}
                  onClick={() => setWin(w.key)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    win === w.key ? "bg-aiventra-ink text-white" : "text-black/45 hover:bg-black/[0.04]"
                  )}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            <p className="mb-3 font-display text-2xl font-bold text-aiventra-ink">{formatINR(total)}</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={series} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "rgba(0,0,0,0.4)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "rgba(0,0,0,0.4)" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatINR(v)} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.06)", fontSize: 12 }} formatter={(v: number) => [formatINR(v), "Forecast"]} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#FF6B00" />
              </BarChart>
            </ResponsiveContainer>
            <p className="mt-2 text-[11px] text-black/35">
              Blends scheduled booking milestones with pipeline value × AI closing probability — see lib/ai/revenue-forecast.ts
            </p>
          </CardContent>
        </Card>

        {/* Auto Reminders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell size={15} className="text-aiventra-orange" /> Auto Reminders
            </CardTitle>
            <Badge tone="red">{reminders.filter((r) => r.isOverdue).length} overdue</Badge>
          </CardHeader>
          <CardContent className="max-h-[340px] space-y-2.5 overflow-y-auto">
            {reminders.slice(0, 6).map((r) => (
              <ReminderRow key={r.milestone.id} item={r} />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Broker commissions */}
      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={15} className="text-aiventra-orange" /> Broker Commissions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/[0.06] bg-black/[0.02] text-xs text-black/40">
              <tr>
                <th className="px-5 py-3 font-medium">Broker</th>
                <th className="px-5 py-3 font-medium">Project</th>
                <th className="px-5 py-3 font-medium">Booking value</th>
                <th className="px-5 py-3 font-medium">Commission</th>
                <th className="px-5 py-3 font-medium">Due</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {brokerCommissions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-black/30">
                    No broker commissions recorded yet.
                  </td>
                </tr>
              )}
              {brokerCommissions.map((c) => (
                <tr key={c.id} className="border-b border-black/[0.04] last:border-0">
                  <td className="px-5 py-3 font-medium text-aiventra-ink">{c.brokerName}</td>
                  <td className="px-5 py-3 text-black/60">{c.projectName}</td>
                  <td className="px-5 py-3 text-black/60">{formatINR(c.bookingAmount)}</td>
                  <td className="px-5 py-3 font-semibold text-aiventra-ink">
                    {formatINR(c.commissionAmount)} <span className="text-xs font-normal text-black/35">({c.commissionPct}%)</span>
                  </td>
                  <td className="px-5 py-3 text-black/60">
                    {new Date(c.dueDateISO).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={c.status === "Paid" ? "green" : "amber"}>{c.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function FinKpi({
  label,
  value,
  icon: Icon,
  tone,
  accent,
}: {
  label: string;
  value: string;
  icon: typeof IndianRupee;
  tone?: "orange";
  accent?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 shadow-soft",
        tone === "orange" ? "border-transparent bg-gradient-to-br from-aiventra-orange to-[#FF8A3D] text-white" : "border-black/[0.06] bg-white"
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn("text-xs font-medium", tone === "orange" ? "text-white/75" : "text-black/45")}>{label}</span>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl", tone === "orange" ? "bg-white/15" : "bg-aiventra-orange/10")}>
          <Icon size={15} className={tone === "orange" ? "text-white" : accent || "text-aiventra-orange"} />
        </div>
      </div>
      <p className="mt-3 font-display text-2xl font-bold leading-none">{value}</p>
    </div>
  );
}

function ReminderRow({ item }: { item: ReturnType<typeof getAutoReminders>[number] }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function sendReminder() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/payment-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: item.booking.customerName,
          label: item.milestone.label,
          amount: formatINR(item.milestone.amount),
          isOverdue: item.isOverdue,
          days: item.daysUntilOrOverdue,
        }),
      });
      const data = await res.json();
      setMessage(data.message);
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-black/[0.06] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-aiventra-ink">{item.booking.customerName}</p>
          <p className="text-xs text-black/40">
            {item.milestone.label} · {formatINR(item.milestone.amount)}
          </p>
        </div>
        <Badge tone={item.isOverdue ? "red" : "amber"}>
          {item.isOverdue ? `${item.daysUntilOrOverdue}d overdue` : `due in ${item.daysUntilOrOverdue}d`}
        </Badge>
      </div>
      {message ? (
        <p className="mt-2 rounded-lg bg-aiventra-orange/[0.06] p-2 text-[11px] leading-relaxed text-[#8a4600]">{message}</p>
      ) : (
        <button onClick={sendReminder} disabled={loading || sent} className="mt-2 flex items-center gap-1.5 text-xs font-medium text-aiventra-orange hover:underline disabled:opacity-50">
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          {sent ? "Reminder sent" : "Send reminder"}
        </button>
      )}
    </div>
  );
}
