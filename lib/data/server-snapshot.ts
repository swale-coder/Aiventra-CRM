import "server-only";
import { createClient } from "@/lib/supabase/server";
import { scoreLead } from "@/lib/ai/lead-scoring";
import { forecastRevenue } from "@/lib/ai/revenue-forecast";
import {
  mapOrgUser,
  mapProject,
  mapUnit,
  mapLead,
  mapSiteVisit,
  mapMilestone,
  mapBooking,
  mapBrokerCommission,
  mapConstructionStage,
  mapTask,
  mapComplianceItem,
} from "@/lib/data/mappers";
import type { CrmSnapshot } from "@/lib/ai/copilot-engine";

/** Server-only counterpart to CrmDataProvider's fetch, used to ground the AI Copilot in real data. */
export async function buildServerSnapshot(orgId: string): Promise<CrmSnapshot> {
  const supabase = await createClient();
  if (!supabase) {
    return {
      leads: [],
      projects: [],
      bookings: [],
      brokerCommissions: [],
      constructionStages: [],
      tasks: [],
      complianceItems: [],
      siteVisits: [],
      salesReps: [],
      orgUsers: [],
      kpis: { monthlyRevenue: 0, bookings: 0, hotLeads: 0, activeProjects: 0, conversionRate: 0, builderHealthScore: 0 },
      revenueForecast: { next7Days: 0, nextMonth: 0, nextQuarter: 0, next7DaysSeries: [], nextMonthSeries: [], nextQuarterSeries: [] },
    };
  }

  const [orgUsersRes, projectsRes, unitsRes, leadsRes, siteVisitsRes, bookingsRes, milestonesRes, brokerCommissionsRes, constructionStagesRes, tasksRes, complianceItemsRes] =
    await Promise.all([
      supabase.from("org_users").select("*").eq("org_id", orgId),
      supabase.from("projects").select("*").eq("org_id", orgId),
      supabase.from("units").select("*").eq("org_id", orgId),
      supabase.from("leads").select("*").eq("org_id", orgId),
      supabase.from("site_visits").select("*").eq("org_id", orgId),
      supabase.from("bookings").select("*").eq("org_id", orgId),
      supabase.from("payment_milestones").select("*").eq("org_id", orgId),
      supabase.from("broker_commissions").select("*").eq("org_id", orgId),
      supabase.from("construction_stages").select("*").eq("org_id", orgId),
      supabase.from("tasks").select("*").eq("org_id", orgId),
      supabase.from("compliance_items").select("*").eq("org_id", orgId),
    ]);

  const projectNameById = new Map((projectsRes.data ?? []).map((p: any) => [p.id, p.name]));
  const userNameById = new Map((orgUsersRes.data ?? []).map((u: any) => [u.id, u.name]));
  const leadNameById = new Map((leadsRes.data ?? []).map((l: any) => [l.id, l.name]));

  const unitsRows = unitsRes.data ?? [];
  const units = unitsRows.map(mapUnit);
  const unitNoById = new Map(units.map((u) => [u.id, u.unitNo]));
  const projectNameByUnitId = new Map(units.map((u) => [u.id, projectNameById.get(u.projectId) ?? ""]));

  const projects = (projectsRes.data ?? []).map((p: any) => {
    const projUnits = unitsRows.filter((u: any) => u.project_id === p.id);
    const sold = projUnits.filter((u: any) => u.status === "Sold").length;
    const held = projUnits.filter((u: any) => u.status === "Held").length;
    const revenue = projUnits.filter((u: any) => u.status === "Sold").reduce((s: number, u: any) => s + Number(u.price), 0);
    return mapProject(p, { total: projUnits.length, sold, held, revenue });
  });

  const orgUsers = (orgUsersRes.data ?? []).map(mapOrgUser);

  const leads = (leadsRes.data ?? []).map((row: any) => {
    const lead = mapLead(row, projectNameById);
    const project = (projectsRes.data ?? []).find((p: any) => p.id === row.interested_project_id);
    const avgTicket = project ? Number(project.avg_ticket_size ?? 0) || 12000000 : 12000000;
    const result = scoreLead(lead, avgTicket);
    return { ...lead, score: result.score, closingProbability: result.closingProbability };
  });

  const siteVisits = (siteVisitsRes.data ?? []).map((row: any) => mapSiteVisit(row, leadNameById, projectNameById, userNameById));

  const milestonesByBooking = new Map<string, any[]>();
  for (const m of milestonesRes.data ?? []) {
    const arr = milestonesByBooking.get(m.booking_id) ?? [];
    arr.push(m);
    milestonesByBooking.set(m.booking_id, arr);
  }
  const customerNameByIdPlaceholder = new Map<string, string>();
  const { data: customersData } = await supabase.from("customers").select("id, name").eq("org_id", orgId);
  for (const c of customersData ?? []) customerNameByIdPlaceholder.set(c.id, c.name);

  const bookings = (bookingsRes.data ?? []).map((row: any) =>
    mapBooking(row, (milestonesByBooking.get(row.id) ?? []).map(mapMilestone), unitNoById, projectNameByUnitId, customerNameByIdPlaceholder)
  );
  const bookingAmountById = new Map(bookings.map((b) => [b.id, b.bookingAmount]));
  const bookingProjectById = new Map(bookings.map((b) => [b.id, b.projectName]));

  const brokerCommissions = (brokerCommissionsRes.data ?? []).map((row: any) => mapBrokerCommission(row, bookingProjectById, bookingAmountById));
  const constructionStages = (constructionStagesRes.data ?? []).map((row: any) => mapConstructionStage(row, projectNameById));
  const tasks = (tasksRes.data ?? []).map((row: any) => mapTask(row, projectNameById));
  const complianceItems = (complianceItemsRes.data ?? []).map((row: any) => mapComplianceItem(row, projectNameById));

  const salesRoles = ["Sales Manager", "Sales Executive"];
  const reps = orgUsers.filter((u) => salesRoles.includes(u.role));
  const salesReps = reps
    .map((u) => {
      const repLeads = leads.filter((l) => l.assignedTo === u.id);
      const repVisits = siteVisits.filter((v) => leads.find((l) => l.id === v.leadId)?.assignedTo === u.id);
      const repBookings = bookings.filter((b) => b.bookedBy === u.id);
      const revenue = repBookings.reduce((s, b) => s + b.bookingAmount, 0);
      const conversionRate = repLeads.length ? Math.round((repBookings.length / repLeads.length) * 100) : 0;
      return {
        id: u.id,
        name: u.name,
        avatarColor: u.avatarColor,
        leadsAssigned: repLeads.length,
        visitsCompleted: repVisits.filter((v) => v.status === "Completed").length,
        bookingsClosed: repBookings.length,
        revenueGenerated: revenue,
        conversionRate,
        rank: 0,
      };
    })
    .sort((a, b) => b.revenueGenerated - a.revenueGenerated)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  const now = new Date();
  const monthlyRevenue = bookings.reduce((sum, b) => {
    const paid = b.milestones
      .filter((m) => m.status === "Paid" && m.paidDateISO)
      .filter((m) => {
        const d = new Date(m.paidDateISO!);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, m) => s + m.amount, 0);
    return sum + paid;
  }, 0);
  const hotLeads = leads.filter((l) => l.score >= 70).length;
  const won = leads.filter((l) => l.stage === "Won").length;
  const conversionRate = leads.length ? Math.round((won / leads.length) * 100) : 0;
  const avgPaymentConsistency = bookings.length ? Math.round(bookings.reduce((s, b) => s + b.paymentConsistency, 0) / bookings.length) : 100;
  const builderHealthScore = Math.round((avgPaymentConsistency + conversionRate + Math.min(100, hotLeads * 2)) / 3);

  const kpis = { monthlyRevenue, bookings: bookings.length, hotLeads, activeProjects: projects.length, conversionRate, builderHealthScore };
  const revenueForecast = leads.length || bookings.length ? forecastRevenue(leads, bookings, monthlyRevenue || 1) : {
    next7Days: 0,
    nextMonth: 0,
    nextQuarter: 0,
    next7DaysSeries: [],
    nextMonthSeries: [],
    nextQuarterSeries: [],
  };

  return { leads, projects, bookings, brokerCommissions, constructionStages, tasks, complianceItems, siteVisits, salesReps, orgUsers, kpis, revenueForecast };
}
