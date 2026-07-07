"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useAuth } from "@/lib/auth/AuthProvider";
import { scoreLead } from "@/lib/ai/lead-scoring";
import { forecastRevenue, RevenueForecast } from "@/lib/ai/revenue-forecast";
import {
  OrgUser,
  Project,
  UnitType,
  Lead,
  LeadStage,
  Customer,
  SiteVisit,
  Booking,
  BrokerCommission,
  ConstructionStage,
  Task,
  TaskStatus,
  SiteReport,
  ProjectDocument,
  DocumentStatus,
  ComplianceItem,
  SalesRep,
  Role,
} from "@/lib/types";
import {
  mapOrgUser,
  mapProject,
  mapUnit,
  mapLead,
  mapCustomer,
  mapTimelineEvent,
  mapSiteVisit,
  mapMilestone,
  mapBooking,
  mapBrokerCommission,
  mapConstructionStage,
  mapTask,
  mapSiteReport,
  mapDocument,
  mapComplianceItem,
} from "@/lib/data/mappers";

export interface Kpis {
  monthlyRevenue: number;
  bookings: number;
  hotLeads: number;
  activeProjects: number;
  conversionRate: number;
  builderHealthScore: number;
}

interface CrmData {
  loading: boolean;
  error: string | null;
  orgId: string | null;
  orgUsers: OrgUser[];
  projects: Project[];
  units: UnitType[];
  leads: Lead[];
  customers: Customer[];
  siteVisits: SiteVisit[];
  bookings: Booking[];
  brokerCommissions: BrokerCommission[];
  constructionStages: ConstructionStage[];
  tasks: Task[];
  siteReports: SiteReport[];
  documents: ProjectDocument[];
  complianceItems: ComplianceItem[];
  salesReps: SalesRep[];
  kpis: Kpis;
  revenueTrend: { month: string; revenue: number }[];
  leadFunnel: { stage: string; count: number }[];
  revenueForecast: RevenueForecast;
  refetch: () => Promise<void>;

  // Mutations
  createLead: (input: NewLeadInput) => Promise<void>;
  updateLeadStage: (leadId: string, stage: LeadStage) => Promise<void>;
  createSiteVisit: (input: NewSiteVisitInput) => Promise<void>;
  updateSiteVisitStatus: (visitId: string, status: SiteVisit["status"]) => Promise<void>;
  createBooking: (input: NewBookingInput) => Promise<void>;
  createProjectWithUnits: (input: NewProjectInput) => Promise<void>;
  createTask: (input: NewTaskInput) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  createDocument: (input: NewDocumentInput) => Promise<void>;
  updateDocumentStatus: (docId: string, status: DocumentStatus) => Promise<void>;
}

export interface NewLeadInput {
  name: string;
  phone: string;
  email: string;
  city: string;
  source: Lead["source"];
  budgetMin: number;
  budgetMax: number;
  interestedProjectId: string;
  configPreference: string;
  assignedTo: string;
}

export interface NewSiteVisitInput {
  leadId: string;
  projectId: string;
  scheduledAt: string;
  assignedTo: string;
  notes?: string;
}

export interface NewBookingInput {
  unitId: string;
  customerId: string;
  bookedBy: string;
  bookingAmount: number;
  tokenAmount: number;
  tokenPaid: boolean;
  brokerName?: string;
}

export interface NewProjectInput {
  name: string;
  location: string;
  towers: number;
  floorsPerTower: number;
  possessionDate: string;
  avgTicketSize: number;
  configurations: string[];
  reraId: string;
}

export interface NewTaskInput {
  title: string;
  projectId: string;
  assignedTo: string;
  dueDate: string;
  priority: Task["priority"];
}

export interface NewDocumentInput {
  name: string;
  projectId: string;
  docType: string;
}

const CrmDataContext = createContext<CrmData | null>(null);

const EMPTY_KPIS: Kpis = { monthlyRevenue: 0, bookings: 0, hotLeads: 0, activeProjects: 0, conversionRate: 0, builderHealthScore: 0 };
const EMPTY_FORECAST: RevenueForecast = {
  next7Days: 0,
  nextMonth: 0,
  nextQuarter: 0,
  next7DaysSeries: [],
  nextMonthSeries: [],
  nextQuarterSeries: [],
};

const FUNNEL_STAGES: LeadStage[] = ["New", "Contacted", "Interested", "Visit Scheduled", "Negotiation", "Won"];

function monthMilestonePlan(amount: number, bookingDate: Date, tokenPaid: boolean) {
  const plan = [
    { label: "Token amount", pct: 2, offsetDays: 0, status: tokenPaid ? "Paid" : "Pending" },
    { label: "On agreement", pct: 18, offsetDays: 21, status: "Pending" },
    { label: "On slab completion", pct: 40, offsetDays: 150, status: "Pending" },
    { label: "On possession", pct: 40, offsetDays: 600, status: "Pending" },
  ] as const;
  return plan.map((p) => {
    const due = new Date(bookingDate);
    due.setDate(due.getDate() + p.offsetDays);
    return {
      label: p.label,
      due_date: due.toISOString(),
      amount: Math.round((amount * p.pct) / 100),
      status: p.status,
      paid_date: p.status === "Paid" ? bookingDate.toISOString() : null,
    };
  });
}

function seedRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function CrmDataProvider({ children }: { children: React.ReactNode }) {
  const { organization } = useAuth();
  const orgId = organization?.id ?? null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [raw, setRaw] = useState<{
    orgUsers: OrgUser[];
    projects: Project[];
    units: UnitType[];
    leads: Lead[];
    customers: Customer[];
    siteVisits: SiteVisit[];
    bookings: Booking[];
    brokerCommissions: BrokerCommission[];
    constructionStages: ConstructionStage[];
    tasks: Task[];
    siteReports: SiteReport[];
    documents: ProjectDocument[];
    complianceItems: ComplianceItem[];
  }>({
    orgUsers: [],
    projects: [],
    units: [],
    leads: [],
    customers: [],
    siteVisits: [],
    bookings: [],
    brokerCommissions: [],
    constructionStages: [],
    tasks: [],
    siteReports: [],
    documents: [],
    complianceItems: [],
  });

  const fetchAll = useCallback(async () => {
    if (!isSupabaseConfigured || !orgId) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const [
        orgUsersRes,
        projectsRes,
        unitsRes,
        leadsRes,
        customersRes,
        timelineRes,
        siteVisitsRes,
        bookingsRes,
        milestonesRes,
        brokerCommissionsRes,
        constructionStagesRes,
        tasksRes,
        siteReportsRes,
        documentsRes,
        complianceItemsRes,
      ] = await Promise.all([
        supabase.from("org_users").select("*").eq("org_id", orgId),
        supabase.from("projects").select("*").eq("org_id", orgId),
        supabase.from("units").select("*").eq("org_id", orgId),
        supabase.from("leads").select("*").eq("org_id", orgId),
        supabase.from("customers").select("*").eq("org_id", orgId),
        supabase.from("customer_timeline_events").select("*").eq("org_id", orgId).order("event_at", { ascending: false }),
        supabase.from("site_visits").select("*").eq("org_id", orgId),
        supabase.from("bookings").select("*").eq("org_id", orgId),
        supabase.from("payment_milestones").select("*").eq("org_id", orgId),
        supabase.from("broker_commissions").select("*").eq("org_id", orgId),
        supabase.from("construction_stages").select("*").eq("org_id", orgId),
        supabase.from("tasks").select("*").eq("org_id", orgId),
        supabase.from("site_reports").select("*").eq("org_id", orgId).order("report_date", { ascending: false }),
        supabase.from("project_documents").select("*").eq("org_id", orgId).order("uploaded_at", { ascending: false }),
        supabase.from("compliance_items").select("*").eq("org_id", orgId),
      ]);

      const firstError = [
        orgUsersRes,
        projectsRes,
        unitsRes,
        leadsRes,
        customersRes,
        timelineRes,
        siteVisitsRes,
        bookingsRes,
        milestonesRes,
        brokerCommissionsRes,
        constructionStagesRes,
        tasksRes,
        siteReportsRes,
        documentsRes,
        complianceItemsRes,
      ].find((r) => r.error);
      if (firstError?.error) throw firstError.error;

      const projectNameById = new Map((projectsRes.data ?? []).map((p: any) => [p.id, p.name]));
      const userNameById = new Map((orgUsersRes.data ?? []).map((u: any) => [u.id, u.name]));

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

      const leads: Lead[] = (leadsRes.data ?? []).map((row: any) => {
        const lead = mapLead(row, projectNameById);
        const project = (projectsRes.data ?? []).find((p: any) => p.id === row.interested_project_id);
        const avgTicket = project ? Number(project.avg_ticket_size ?? 0) || 12000000 : 12000000;
        const result = scoreLead(lead, avgTicket);
        return { ...lead, score: result.score, closingProbability: result.closingProbability };
      });

      const timelineByCustomer = new Map<string, any[]>();
      for (const t of timelineRes.data ?? []) {
        const arr = timelineByCustomer.get(t.customer_id) ?? [];
        arr.push(t);
        timelineByCustomer.set(t.customer_id, arr);
      }
      const customers = (customersRes.data ?? []).map((row: any) =>
        mapCustomer(row, (timelineByCustomer.get(row.id) ?? []).map(mapTimelineEvent))
      );
      const customerNameById = new Map(customers.map((c) => [c.id, c.name]));

      const leadNameById = new Map((leadsRes.data ?? []).map((l: any) => [l.id, l.name]));
      const siteVisits = (siteVisitsRes.data ?? []).map((row: any) => mapSiteVisit(row, leadNameById, projectNameById, userNameById));

      const milestonesByBooking = new Map<string, any[]>();
      for (const m of milestonesRes.data ?? []) {
        const arr = milestonesByBooking.get(m.booking_id) ?? [];
        arr.push(m);
        milestonesByBooking.set(m.booking_id, arr);
      }
      const bookings = (bookingsRes.data ?? []).map((row: any) =>
        mapBooking(
          row,
          (milestonesByBooking.get(row.id) ?? []).map(mapMilestone),
          unitNoById,
          projectNameByUnitId,
          customerNameById
        )
      );
      const bookingAmountById = new Map(bookings.map((b) => [b.id, b.bookingAmount]));
      const bookingProjectById = new Map(bookings.map((b) => [b.id, b.projectName]));

      const brokerCommissions = (brokerCommissionsRes.data ?? []).map((row: any) =>
        mapBrokerCommission(row, bookingProjectById, bookingAmountById)
      );

      const constructionStages = (constructionStagesRes.data ?? []).map((row: any) => mapConstructionStage(row, projectNameById));
      const tasks = (tasksRes.data ?? []).map((row: any) => mapTask(row, projectNameById));
      const siteReports = (siteReportsRes.data ?? []).map((row: any) => mapSiteReport(row, projectNameById));
      const documents = (documentsRes.data ?? []).map((row: any) => mapDocument(row, projectNameById, userNameById));
      const complianceItems = (complianceItemsRes.data ?? []).map((row: any) => mapComplianceItem(row, projectNameById));

      setRaw({
        orgUsers,
        projects,
        units,
        leads,
        customers,
        siteVisits,
        bookings,
        brokerCommissions,
        constructionStages,
        tasks,
        siteReports,
        documents,
        complianceItems,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load CRM data.");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ---------------- Derived data ----------------

  const salesReps: SalesRep[] = useMemo(() => {
    const salesRoles: Role[] = ["Sales Manager", "Sales Executive"];
    const reps = raw.orgUsers.filter((u) => salesRoles.includes(u.role));
    const scored = reps.map((u) => {
      const repLeads = raw.leads.filter((l) => l.assignedTo === u.id);
      const repVisits = raw.siteVisits.filter((v) => raw.leads.find((l) => l.id === v.leadId)?.assignedTo === u.id);
      const repBookings = raw.bookings.filter((b) => b.bookedBy === u.id);
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
    });
    scored.sort((a, b) => b.revenueGenerated - a.revenueGenerated);
    scored.forEach((r, i) => (r.rank = i + 1));
    return scored;
  }, [raw.orgUsers, raw.leads, raw.siteVisits, raw.bookings]);

  const kpis: Kpis = useMemo(() => {
    if (!raw.leads.length && !raw.bookings.length && !raw.projects.length) return EMPTY_KPIS;
    const now = new Date();
    const monthlyRevenue = raw.bookings.reduce((sum, b) => {
      const paidThisMonth = b.milestones
        .filter((m) => m.status === "Paid" && m.paidDateISO)
        .filter((m) => {
          const d = new Date(m.paidDateISO!);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((s, m) => s + m.amount, 0);
      return sum + paidThisMonth;
    }, 0);
    const hotLeads = raw.leads.filter((l) => l.score >= 70).length;
    const won = raw.leads.filter((l) => l.stage === "Won").length;
    const conversionRate = raw.leads.length ? Math.round((won / raw.leads.length) * 100) : 0;
    const avgPaymentConsistency = raw.bookings.length
      ? Math.round(raw.bookings.reduce((s, b) => s + b.paymentConsistency, 0) / raw.bookings.length)
      : 100;
    const builderHealthScore = Math.round((avgPaymentConsistency + conversionRate + Math.min(100, hotLeads * 2)) / 3);
    return {
      monthlyRevenue,
      bookings: raw.bookings.length,
      hotLeads,
      activeProjects: raw.projects.length,
      conversionRate,
      builderHealthScore,
    };
  }, [raw.bookings, raw.leads, raw.projects]);

  const revenueTrend = useMemo(() => {
    const months: { key: string; month: string }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: d.toLocaleDateString("en-IN", { month: "short" }) });
    }
    const totals = new Map(months.map((m) => [m.key, 0]));
    for (const b of raw.bookings) {
      for (const m of b.milestones) {
        if (m.status !== "Paid" || !m.paidDateISO) continue;
        const d = new Date(m.paidDateISO);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (totals.has(key)) totals.set(key, (totals.get(key) ?? 0) + m.amount);
      }
    }
    return months.map((m) => ({ month: m.month, revenue: Math.round(((totals.get(m.key) ?? 0) / 10000000) * 10) / 10 }));
  }, [raw.bookings]);

  const leadFunnel = useMemo(
    () => FUNNEL_STAGES.map((stage) => ({ stage, count: raw.leads.filter((l) => l.stage === stage).length })),
    [raw.leads]
  );

  const revenueForecast = useMemo(() => {
    if (!raw.leads.length && !raw.bookings.length) return EMPTY_FORECAST;
    return forecastRevenue(raw.leads, raw.bookings, kpis.monthlyRevenue || 1);
  }, [raw.leads, raw.bookings, kpis.monthlyRevenue]);

  // ---------------- Mutations ----------------

  async function withSupabase<T>(fn: (client: NonNullable<ReturnType<typeof createClient>>) => Promise<T>): Promise<T> {
    const supabase = createClient();
    if (!supabase) throw new Error("Supabase isn't configured.");
    if (!orgId) throw new Error("No organization in session.");
    return fn(supabase);
  }

  const createLead = useCallback(
    async (input: NewLeadInput) => {
      await withSupabase(async (supabase) => {
        const { error: err } = await supabase.from("leads").insert({
          org_id: orgId,
          name: input.name,
          phone: input.phone,
          email: input.email,
          city: input.city,
          source: input.source,
          budget_min: input.budgetMin,
          budget_max: input.budgetMax,
          interested_project_id: input.interestedProjectId || null,
          config_preference: input.configPreference,
          assigned_to: input.assignedTo || null,
          stage: "New",
          response_speed_hrs: 12,
          avg_call_duration_min: 5,
          visit_frequency: 0,
          interest_score: 40,
          last_contacted_at: new Date().toISOString(),
        });
        if (err) throw err;
      });
      await fetchAll();
    },
    [orgId, fetchAll]
  );

  const updateLeadStage = useCallback(
    async (leadId: string, stage: LeadStage) => {
      await withSupabase(async (supabase) => {
        const { error: err } = await supabase.from("leads").update({ stage }).eq("id", leadId);
        if (err) throw err;
      });
      await fetchAll();
    },
    [fetchAll]
  );

  const createSiteVisit = useCallback(
    async (input: NewSiteVisitInput) => {
      await withSupabase(async (supabase) => {
        const { error: err } = await supabase.from("site_visits").insert({
          org_id: orgId,
          lead_id: input.leadId || null,
          project_id: input.projectId || null,
          scheduled_at: input.scheduledAt,
          assigned_to: input.assignedTo || null,
          status: "Scheduled",
          notes: input.notes || null,
        });
        if (err) throw err;
      });
      await fetchAll();
    },
    [orgId, fetchAll]
  );

  const updateSiteVisitStatus = useCallback(
    async (visitId: string, status: SiteVisit["status"]) => {
      await withSupabase(async (supabase) => {
        const { error: err } = await supabase.from("site_visits").update({ status }).eq("id", visitId);
        if (err) throw err;
      });
      await fetchAll();
    },
    [fetchAll]
  );

  const createBooking = useCallback(
    async (input: NewBookingInput) => {
      await withSupabase(async (supabase) => {
        const bookingDate = new Date();
        const { data: booking, error: err } = await supabase
          .from("bookings")
          .insert({
            org_id: orgId,
            unit_id: input.unitId,
            customer_id: input.customerId,
            booked_by: input.bookedBy || null,
            booking_amount: input.bookingAmount,
            token_amount: input.tokenAmount,
            token_paid: input.tokenPaid,
            broker_name: input.brokerName || null,
            status: "Confirmed",
            booking_date: bookingDate.toISOString(),
            missed_milestones: 0,
            payment_consistency: 100,
            communication_responsiveness: 100,
          })
          .select()
          .single();
        if (err) throw err;

        const milestonePlan = monthMilestonePlan(input.bookingAmount, bookingDate, input.tokenPaid);
        const { error: msErr } = await supabase.from("payment_milestones").insert(
          milestonePlan.map((m) => ({ ...m, booking_id: booking.id, org_id: orgId }))
        );
        if (msErr) throw msErr;

        const { error: unitErr } = await supabase.from("units").update({ status: "Booked" }).eq("id", input.unitId);
        if (unitErr) throw unitErr;
      });
      await fetchAll();
    },
    [orgId, fetchAll]
  );

  const createProjectWithUnits = useCallback(
    async (input: NewProjectInput) => {
      await withSupabase(async (supabase) => {
        const { data: project, error: err } = await supabase
          .from("projects")
          .insert({
            org_id: orgId,
            name: input.name,
            location: input.location,
            towers: input.towers,
            floors_per_tower: input.floorsPerTower,
            total_units: input.towers * input.floorsPerTower * 4,
            construction_progress: 0,
            possession_date: input.possessionDate,
            avg_ticket_size: input.avgTicketSize,
            configurations: input.configurations,
            rera_id: input.reraId,
          })
          .select()
          .single();
        if (err) throw err;

        const towerLabels = ["A", "B", "C", "D", "E"].slice(0, input.towers);
        const facings = ["North", "South", "East", "West", "North-East", "South-East"];
        const rand = seedRandom(input.towers * 97 + input.floorsPerTower * 13 + 5);
        const unitsToInsert: any[] = [];
        for (const tower of towerLabels) {
          for (let f = 1; f <= input.floorsPerTower; f++) {
            for (let u = 1; u <= 4; u++) {
              const config = input.configurations[Math.floor(rand() * input.configurations.length)] ?? "2BHK";
              const area = config === "2BHK" ? 1150 : config === "3BHK" ? 1580 : config === "4BHK" ? 2100 : 2600;
              unitsToInsert.push({
                org_id: orgId,
                project_id: project.id,
                tower,
                floor: f,
                unit_no: `${tower}-${f}${String(u).padStart(2, "0")}`,
                config,
                area_sqft: area,
                price: Math.round((area * (input.avgTicketSize / 1580 || 7500)) / 100000) * 100000,
                status: "Available",
                facing: facings[Math.floor(rand() * facings.length)],
              });
            }
          }
        }
        const { error: unitsErr } = await supabase.from("units").insert(unitsToInsert);
        if (unitsErr) throw unitsErr;
      });
      await fetchAll();
    },
    [orgId, fetchAll]
  );

  const createTask = useCallback(
    async (input: NewTaskInput) => {
      await withSupabase(async (supabase) => {
        const { error: err } = await supabase.from("tasks").insert({
          org_id: orgId,
          title: input.title,
          project_id: input.projectId || null,
          assigned_to: input.assignedTo || null,
          due_date: input.dueDate,
          priority: input.priority,
          status: "To Do",
        });
        if (err) throw err;
      });
      await fetchAll();
    },
    [orgId, fetchAll]
  );

  const updateTaskStatus = useCallback(
    async (taskId: string, status: TaskStatus) => {
      await withSupabase(async (supabase) => {
        const { error: err } = await supabase.from("tasks").update({ status }).eq("id", taskId);
        if (err) throw err;
      });
      await fetchAll();
    },
    [fetchAll]
  );

  const createDocument = useCallback(
    async (input: NewDocumentInput) => {
      await withSupabase(async (supabase) => {
        const { error: err } = await supabase.from("project_documents").insert({
          org_id: orgId,
          name: input.name,
          project_id: input.projectId || null,
          doc_type: input.docType,
          status: "Pending",
        });
        if (err) throw err;
      });
      await fetchAll();
    },
    [orgId, fetchAll]
  );

  const updateDocumentStatus = useCallback(
    async (docId: string, status: DocumentStatus) => {
      await withSupabase(async (supabase) => {
        const { data: session } = await supabase.auth.getUser();
        let verifiedBy: string | null = null;
        if (status === "Verified" && session.user) {
          const { data: ou } = await supabase.from("org_users").select("id").eq("user_id", session.user.id).eq("org_id", orgId).maybeSingle();
          verifiedBy = ou?.id ?? null;
        }
        const { error: err } = await supabase
          .from("project_documents")
          .update({ status, verified_by: verifiedBy })
          .eq("id", docId);
        if (err) throw err;
      });
      await fetchAll();
    },
    [orgId, fetchAll]
  );

  const value: CrmData = {
    loading,
    error,
    orgId,
    ...raw,
    salesReps,
    kpis,
    revenueTrend,
    leadFunnel,
    revenueForecast,
    refetch: fetchAll,
    createLead,
    updateLeadStage,
    createSiteVisit,
    updateSiteVisitStatus,
    createBooking,
    createProjectWithUnits,
    createTask,
    updateTaskStatus,
    createDocument,
    updateDocumentStatus,
  };

  return <CrmDataContext.Provider value={value}>{children}</CrmDataContext.Provider>;
}

export function useCrmData() {
  const ctx = useContext(CrmDataContext);
  if (!ctx) throw new Error("useCrmData must be used within a CrmDataProvider");
  return ctx;
}
