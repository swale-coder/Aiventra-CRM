"use client";

import { AppShell } from "@/components/shared/app-shell";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { LeadFunnel } from "@/components/dashboard/lead-funnel";
import { AiRecommendations, HotLeadsList } from "@/components/dashboard/ai-widgets";
import { ProjectVelocity, FollowUpTimeline, SalesLeaderboard, BuilderHealthScore, LastUpdated } from "@/components/dashboard/misc-widgets";
import { useCrmData } from "@/lib/data/CrmDataProvider";
import { formatINR } from "@/lib/utils";
import { IndianRupee, KeyRound, Flame, Building2, TrendingUp, Sparkles, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function DashboardPage() {
  const { orgUser, organization } = useAuth();
  const { kpis, leads, bookings, revenueTrend } = useCrmData();
  const firstName = orgUser?.name?.split(" ")[0] ?? "there";
  const inNegotiation = leads.filter((l) => l.stage === "Negotiation").length;
  const thisMonthBookings = bookings.filter((b) => {
    const d = new Date(b.bookingDateISO);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const lastTwo = revenueTrend.slice(-2);
  const momChange =
    lastTwo.length === 2 && lastTwo[0].revenue > 0
      ? Math.round(((lastTwo[1].revenue - lastTwo[0].revenue) / lastTwo[0].revenue) * 1000) / 10
      : null;

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-bold text-aiventra-ink">Good morning, {firstName}</h1>
          <Sparkles size={18} className="text-aiventra-orange" />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-black/45">Here&apos;s how {organization.name} is performing today.</p>
          <LastUpdated />
        </div>
      </div>

      {/* Top KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard index={0} label="Monthly Revenue" value={formatINR(kpis.monthlyRevenue)} delta="Collected this month" icon={IndianRupee} tone="orange" />
        <KpiCard index={1} label="Bookings" value={String(kpis.bookings)} delta={`${thisMonthBookings} this month`} icon={KeyRound} />
        <KpiCard index={2} label="Hot Leads" value={String(kpis.hotLeads)} delta={`${inNegotiation} in negotiation`} icon={Flame} />
        <KpiCard index={3} label="Active Projects" value={String(kpis.activeProjects)} delta="Currently live" icon={Building2} />
        <KpiCard index={4} label="Conversion Rate" value={`${kpis.conversionRate}%`} delta="Leads → won" icon={TrendingUp} />
      </div>

      {/* Middle: AI recommendations, hot leads, project velocity */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles size={15} className="text-aiventra-orange" /> AI Recommendations
              </CardTitle>
            </div>
            <Badge tone="orange">Live</Badge>
          </CardHeader>
          <CardContent>
            <AiRecommendations />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame size={15} className="text-aiventra-orange" /> Hot Leads
            </CardTitle>
            <a href="/leads" className="flex items-center gap-1 text-xs font-medium text-aiventra-orange hover:underline">
              View all <ArrowUpRight size={12} />
            </a>
          </CardHeader>
          <CardContent>
            <HotLeadsList />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Project Velocity</CardTitle>
            <a href="/projects" className="flex items-center gap-1 text-xs font-medium text-aiventra-orange hover:underline">
              Details <ArrowUpRight size={12} />
            </a>
          </CardHeader>
          <CardContent>
            <ProjectVelocity />
          </CardContent>
        </Card>
      </div>

      {/* Revenue + Funnel */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            {momChange !== null && <Badge tone={momChange >= 0 ? "green" : "ink"}>{momChange >= 0 ? "↑" : "↓"} {Math.abs(momChange)}% MoM</Badge>}
          </CardHeader>
          <CardContent className="pt-3">
            <RevenueChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadFunnel />
          </CardContent>
        </Card>
      </div>

      {/* Bottom: follow-up timeline + leaderboard + health score */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Follow-up Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <FollowUpTimeline />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesLeaderboard />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Builder Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <BuilderHealthScore />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
