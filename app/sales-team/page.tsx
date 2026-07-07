"use client";

import { AppShell } from "@/components/shared/app-shell";
import { useCrmData } from "@/lib/data/CrmDataProvider";
import { InviteMemberDialog } from "@/components/shared/dialogs/invite-member-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";
import { Plus, Trophy, Target, Loader2 } from "lucide-react";

export default function SalesTeamPage() {
  const { orgUsers, salesReps, bookings, siteVisits, kpis, loading } = useCrmData();

  const now = new Date();
  const isThisMonth = (iso: string) => {
    const d = new Date(iso);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };
  const bookingsThisMonth = bookings.filter((b) => isThisMonth(b.bookingDateISO)).length;
  const visitsThisMonth = siteVisits.filter((v) => v.status === "Completed" && isThisMonth(v.dateISO)).length;

  return (
    <AppShell>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-aiventra-ink">Sales Team</h1>
          <p className="text-sm text-black/45">{orgUsers.length} team members · RBAC enabled</p>
        </div>
        <InviteMemberDialog
          trigger={
            <Button size="sm">
              <Plus size={14} /> Invite Member
            </Button>
          }
        />
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-black/30">
          <Loader2 className="animate-spin" size={22} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy size={15} className="text-aiventra-orange" /> Leaderboard — This Month
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {salesReps.length === 0 && <p className="py-6 text-center text-sm text-black/30">No sales reps yet.</p>}
              {salesReps.map((r) => (
                <div key={r.id} className="flex items-center gap-4 rounded-2xl border border-black/[0.05] bg-black/[0.015] p-3.5">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      r.rank === 1 ? "bg-aiventra-orange text-white" : "bg-black/[0.06] text-black/50"
                    }`}
                  >
                    {r.rank}
                  </span>
                  <Avatar name={r.name} color={r.avatarColor} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-aiventra-ink">{r.name}</p>
                    <p className="text-xs text-black/40">
                      {r.leadsAssigned} leads · {r.visitsCompleted} visits
                    </p>
                  </div>
                  <div className="hidden text-center sm:block">
                    <p className="text-sm font-semibold text-aiventra-ink">{r.bookingsClosed}</p>
                    <p className="text-[10px] text-black/40">Bookings</p>
                  </div>
                  <div className="hidden text-center sm:block">
                    <p className="text-sm font-semibold text-emerald-600">{r.conversionRate}%</p>
                    <p className="text-[10px] text-black/40">Conv. rate</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-aiventra-ink">{formatINR(r.revenueGenerated)}</p>
                    <p className="text-[10px] text-black/40">Revenue</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target size={15} className="text-aiventra-orange" /> Team Performance — This Month
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <StatRow label="Bookings closed" value={String(bookingsThisMonth)} />
                <StatRow label="Revenue collected" value={formatINR(kpis.monthlyRevenue)} />
                <StatRow label="Site visits completed" value={String(visitsThisMonth)} />
                <StatRow label="Overall conversion rate" value={`${kpis.conversionRate}%`} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Roster & Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {orgUsers.length === 0 && <p className="py-4 text-center text-sm text-black/30">No team members yet.</p>}
                {orgUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 rounded-xl px-1 py-2">
                    <Avatar name={u.name} color={u.avatarColor} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-aiventra-ink">{u.name}</p>
                      <p className="truncate text-xs text-black/40">{u.email}</p>
                    </div>
                    <Badge tone={u.role === "Owner" ? "orange" : "ink"}>{u.role}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-black/[0.05] pb-2.5 last:border-0 last:pb-0">
      <span className="text-black/50">{label}</span>
      <span className="font-semibold text-aiventra-ink">{value}</span>
    </div>
  );
}
