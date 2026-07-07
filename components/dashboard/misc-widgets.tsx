"use client";

import { useCrmData } from "@/lib/data/CrmDataProvider";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import { formatINR, timeAgo } from "@/lib/utils";
import { Trophy, Clock3, CalendarClock } from "lucide-react";

export function ProjectVelocity() {
  const { projects } = useCrmData();
  if (projects.length === 0) return <p className="py-6 text-center text-sm text-black/30">No active projects yet.</p>;
  return (
    <div className="space-y-4">
      {projects.map((p) => (
        <div key={p.id}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-aiventra-ink">{p.name}</span>
            <span className="text-xs text-black/40">
              {p.soldUnits}/{p.totalUnits || 1} sold
            </span>
          </div>
          <Progress value={p.totalUnits ? (p.soldUnits / p.totalUnits) * 100 : 0} height={7} />
        </div>
      ))}
    </div>
  );
}

export function FollowUpTimeline() {
  const { siteVisits } = useCrmData();
  const upcoming = [...siteVisits]
    .filter((v) => v.status === "Scheduled")
    .sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime());

  if (upcoming.length === 0) return <p className="py-6 text-center text-sm text-black/30">No upcoming visits scheduled.</p>;

  return (
    <div className="relative space-y-5 pl-5">
      <div className="absolute bottom-1 left-[7px] top-1 w-px bg-black/[0.08]" />
      {upcoming.map((v) => (
        <div key={v.id} className="relative">
          <div className="absolute -left-5 top-1 h-3 w-3 rounded-full border-2 border-white bg-aiventra-orange shadow-soft" />
          <p className="text-sm font-medium text-aiventra-ink">{v.leadName}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-black/45">
            <CalendarClock size={12} />
            {new Date(v.dateISO).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · {v.project}
          </p>
        </div>
      ))}
    </div>
  );
}

export function SalesLeaderboard() {
  const { salesReps } = useCrmData();
  if (salesReps.length === 0) return <p className="py-6 text-center text-sm text-black/30">No sales reps yet.</p>;
  return (
    <div className="space-y-2">
      {salesReps.map((r) => (
        <div key={r.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              r.rank === 1 ? "bg-aiventra-orange text-white" : "bg-black/[0.06] text-black/50"
            }`}
          >
            {r.rank === 1 ? <Trophy size={11} /> : r.rank}
          </span>
          <Avatar name={r.name} color={r.avatarColor} size={30} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-aiventra-ink">{r.name}</p>
            <p className="text-xs text-black/40">
              {r.bookingsClosed} bookings · {r.conversionRate}% conv.
            </p>
          </div>
          <span className="text-xs font-semibold text-aiventra-ink">{formatINR(r.revenueGenerated)}</span>
        </div>
      ))}
    </div>
  );
}

export function BuilderHealthScore() {
  const { kpis, leads, bookings, revenueTrend } = useCrmData();
  const score = kpis.builderHealthScore;
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score / 100) * circumference;

  const leadQuality = leads.length ? Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length) : 0;
  const avgPaymentConsistency = bookings.length ? Math.round(bookings.reduce((s, b) => s + b.paymentConsistency, 0) / bookings.length) : 100;
  const lastTwo = revenueTrend.slice(-2);
  const revenueMomentum =
    lastTwo.length === 2 ? Math.max(0, Math.min(100, Math.round(50 + ((lastTwo[1].revenue - lastTwo[0].revenue) / (lastTwo[0].revenue || 1)) * 100))) : 50;

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-28 w-28 shrink-0">
        <svg className="h-28 w-28 -rotate-90">
          <circle cx="56" cy="56" r="42" stroke="rgba(0,0,0,0.06)" strokeWidth="10" fill="none" />
          <circle
            cx="56"
            cy="56"
            r="42"
            stroke="#FF6B00"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold text-aiventra-ink">{score}</span>
          <span className="text-[10px] text-black/40">/ 100</span>
        </div>
      </div>
      <div className="space-y-2 text-xs">
        <HealthRow label="Revenue momentum" value={revenueMomentum} />
        <HealthRow label="Lead quality" value={leadQuality} />
        <HealthRow label="Conversion" value={kpis.conversionRate} />
        <HealthRow label="Payment health" value={avgPaymentConsistency} />
      </div>
    </div>
  );
}

function HealthRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 text-black/45">{label}</span>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-black/[0.06]">
        <div className="h-full rounded-full bg-aiventra-orange" style={{ width: `${value}%` }} />
      </div>
      <span className="font-medium text-aiventra-ink">{value}</span>
    </div>
  );
}

export function LastUpdated() {
  return (
    <p className="flex items-center gap-1.5 text-xs text-black/35">
      <Clock3 size={12} /> Synced {timeAgo(new Date().toISOString())}
    </p>
  );
}
