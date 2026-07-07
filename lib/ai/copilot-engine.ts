import { formatINR } from "@/lib/utils";
import { getFollowUpAlerts } from "@/lib/ai/lead-scoring";
import { predictPaymentRisk, pendingDuesSummary } from "@/lib/ai/payment-risk";
import type { RevenueForecast } from "@/lib/ai/revenue-forecast";
import type { Lead, Project, Booking, BrokerCommission, ConstructionStage, Task, ComplianceItem, SiteVisit, SalesRep, OrgUser } from "@/lib/types";

export interface CrmSnapshot {
  leads: Lead[];
  projects: Project[];
  bookings: Booking[];
  brokerCommissions: BrokerCommission[];
  constructionStages: ConstructionStage[];
  tasks: Task[];
  complianceItems: ComplianceItem[];
  siteVisits: SiteVisit[];
  salesReps: SalesRep[];
  orgUsers: OrgUser[];
  kpis: { monthlyRevenue: number; bookings: number; hotLeads: number; activeProjects: number; conversionRate: number; builderHealthScore: number };
  revenueForecast: RevenueForecast;
}

export interface CopilotTable {
  headers: string[];
  rows: (string | number)[][];
}

export interface CopilotAnswer {
  text: string;
  table?: CopilotTable;
}

function parseAmount(query: string): number | null {
  const m = query.match(/(\d+(?:\.\d+)?)\s*(lakh|lac|l\b|crore|cr\b)/i);
  if (!m) {
    const plain = query.match(/(?:above|over|more than)\s*(?:rs\.?|₹)?\s*(\d+(?:,\d+)*)/i);
    if (plain) return Number(plain[1].replace(/,/g, ""));
    return null;
  }
  const value = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  if (unit.startsWith("cr")) return value * 10000000;
  return value * 100000; // lakh/lac/l
}

function findProject(query: string, projects: Project[]) {
  const q = query.toLowerCase();
  return projects.find((p) => q.includes(p.name.toLowerCase()) || p.name.toLowerCase().split(" ").some((w) => w.length > 3 && q.includes(w)));
}

/**
 * Aiventra Copilot — Phase 5 natural-language query layer.
 *
 * A lightweight intent router grounded entirely in real app data (leads, projects,
 * bookings, construction, tasks, compliance, site visits, sales team), passed in as
 * `data` (fetched per-organization by app/api/ai/copilot/route.ts). Runs with zero
 * external calls, so the Copilot always works even without an OpenAI key — and when a
 * key IS configured, this same engine's output is handed to the model as grounding
 * context so it can't invent numbers not present in the CRM.
 */
export function answerCopilotQuery(query: string, data: CrmSnapshot): CopilotAnswer {
  const { leads, projects, bookings, brokerCommissions, constructionStages, tasks, complianceItems, siteVisits, salesReps, kpis, revenueForecast } = data;
  const q = query.toLowerCase();

  // ---- Hot leads for a project ----
  if (q.includes("hot lead") || (q.includes("lead") && findProject(query, projects))) {
    const project = findProject(query, projects);
    const filtered = (project ? leads.filter((l) => l.interestedProject === project.name) : leads)
      .filter((l) => l.stage !== "Won")
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    return {
      text: project
        ? `${filtered.length} active leads for ${project.name}, sorted by AI hot-lead score:`
        : `Top ${filtered.length} hot leads across all projects:`,
      table: {
        headers: ["Lead", "Score", "Stage", "Project", "Budget"],
        rows: filtered.map((l) => [l.name, l.score, l.stage, l.interestedProject, formatINR(l.budgetMax)]),
      },
    };
  }

  // ---- Who is likely to close (this week) ----
  if (q.includes("likely to close") || q.includes("close this week") || (q.includes("close") && q.includes("week"))) {
    const candidates = leads
      .filter((l) => l.stage === "Negotiation" || l.stage === "Visit Scheduled")
      .sort((a, b) => b.closingProbability - a.closingProbability)
      .slice(0, 6);
    return {
      text: `${candidates.length} leads most likely to close soon, ranked by AI closing probability:`,
      table: {
        headers: ["Lead", "Closing %", "Stage", "Project"],
        rows: candidates.map((l) => [l.name, `${l.closingProbability}%`, l.stage, l.interestedProject]),
      },
    };
  }

  // ---- Revenue forecast ----
  if (q.includes("revenue") && (q.includes("forecast") || q.includes("predict") || /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(q) || q.includes("next"))) {
    const window = q.includes("quarter") ? "quarter" : q.includes("week") || q.includes("7 day") ? "7d" : "month";
    const value = window === "quarter" ? revenueForecast.nextQuarter : window === "7d" ? revenueForecast.next7Days : revenueForecast.nextMonth;
    const label = window === "quarter" ? "next quarter" : window === "7d" ? "the next 7 days" : "next month";
    return {
      text: `Projected revenue for ${label}: ${formatINR(value)}. This blends confirmed booking milestones due in that window with pipeline value (negotiation-stage leads × their AI closing probability).`,
    };
  }

  // ---- Pending payments above an amount ----
  if (q.includes("pending payment") || q.includes("pending due") || q.includes("dues") || (q.includes("payment") && parseAmount(query) !== null)) {
    const threshold = parseAmount(query) ?? 0;
    const rows: (string | number)[][] = [];
    for (const b of bookings) {
      for (const m of b.milestones) {
        if (m.status === "Paid") continue;
        if (m.amount >= threshold) {
          rows.push([b.customerName, m.label, formatINR(m.amount), m.status, b.projectName]);
        }
      }
    }
    rows.sort((a, b) => String(b[3]).localeCompare(String(a[3])));
    return {
      text:
        threshold > 0
          ? `${rows.length} pending/overdue payments above ${formatINR(threshold)}:`
          : `${rows.length} pending/overdue payments across all bookings:`,
      table: rows.length ? { headers: ["Customer", "Milestone", "Amount", "Status", "Project"], rows: rows.slice(0, 8) } : undefined,
    };
  }

  // ---- Payment default risk ----
  if (q.includes("risk") || q.includes("default")) {
    const risky = bookings
      .map((b) => ({ b, risk: predictPaymentRisk(b) }))
      .filter((x) => x.risk.tier !== "Low")
      .sort((a, b) => b.risk.riskScore - a.risk.riskScore);
    return {
      text: `${risky.length} bookings flagged Medium/High payment default risk:`,
      table: risky.length
        ? { headers: ["Customer", "Project", "Risk score", "Tier"], rows: risky.map((x) => [x.b.customerName, x.b.projectName, x.risk.riskScore, x.risk.tier]) }
        : undefined,
    };
  }

  // ---- Construction status for a project ----
  if (q.includes("construction") || q.includes("progress")) {
    const project = findProject(query, projects);
    if (project) {
      const stages = constructionStages.filter((s) => s.project === project.name);
      const delayed = stages.filter((s) => s.status === "Delayed").length;
      return {
        text: `${project.name} is ${project.constructionProgress}% complete overall (${delayed} stage${delayed === 1 ? "" : "s"} delayed). Possession target: ${project.possessionDate}.`,
        table: { headers: ["Stage", "Status", "Progress"], rows: stages.map((s) => [s.stage, s.status, `${s.progress}%`]) },
      };
    }
    return {
      text: `Construction progress across all projects: ${projects.map((p) => `${p.name} ${p.constructionProgress}%`).join(", ")}.`,
    };
  }

  // ---- Compliance ----
  if (q.includes("compliance") || q.includes("rera") || q.includes("legal")) {
    const urgent = complianceItems.filter((c) => c.status !== "Compliant").sort((a, b) => (a.status === "Overdue" ? -1 : 1));
    return {
      text: `${urgent.length} compliance items need attention:`,
      table: urgent.length ? { headers: ["Requirement", "Project", "Authority", "Status"], rows: urgent.map((c) => [c.requirement, c.project, c.authority, c.status]) } : undefined,
    };
  }

  // ---- Tasks ----
  if (q.includes("task")) {
    const open = tasks.filter((t) => t.status !== "Done").sort((a, b) => (a.priority === "High" ? -1 : 1));
    return {
      text: `${open.length} open tasks across all projects:`,
      table: {
        headers: ["Task", "Project", "Priority", "Due"],
        rows: open.slice(0, 8).map((t) => [t.title, t.project, t.priority, t.dueDateISO ? new Date(t.dueDateISO).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"]),
      },
    };
  }

  // ---- Broker commissions ----
  if (q.includes("commission") || q.includes("broker")) {
    const pending = brokerCommissions.filter((c) => c.status === "Pending");
    return {
      text: `${pending.length} broker commissions pending, totalling ${formatINR(pending.reduce((s, c) => s + c.commissionAmount, 0))}:`,
      table: pending.length ? { headers: ["Broker", "Project", "Amount", "Due"], rows: pending.map((c) => [c.brokerName, c.projectName, formatINR(c.commissionAmount), new Date(c.dueDateISO).toLocaleDateString("en-IN", { day: "numeric", month: "short" })]) } : undefined,
    };
  }

  // ---- Site visits ----
  if (q.includes("site visit") || q.includes("visit")) {
    const upcoming = siteVisits.filter((v) => v.status === "Scheduled");
    return {
      text: `${upcoming.length} site visits scheduled:`,
      table: { headers: ["Lead", "Project", "Date", "Assigned to"], rows: upcoming.map((v) => [v.leadName, v.project, new Date(v.dateISO).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), v.assignedTo]) },
    };
  }

  // ---- Going cold / follow-up ----
  if (q.includes("cold") || q.includes("follow")) {
    const alerts = getFollowUpAlerts(leads);
    return {
      text: `${alerts.length} leads going cold, most urgent first:`,
      table: alerts.length ? { headers: ["Lead", "Days since contact", "Score"], rows: alerts.slice(0, 6).map((a) => [a.lead.name, a.daysSinceContact, a.lead.score]) } : undefined,
    };
  }

  // ---- Sales team / leaderboard ----
  if (q.includes("leaderboard") || q.includes("top perform") || q.includes("sales team") || q.includes("rep")) {
    const top = [...salesReps].sort((a, b) => a.rank - b.rank);
    return {
      text: `Sales team ranked by bookings closed this month:`,
      table: { headers: ["Rep", "Bookings", "Conversion", "Revenue"], rows: top.map((r) => [r.name, r.bookingsClosed, `${r.conversionRate}%`, formatINR(r.revenueGenerated)]) },
    };
  }

  // ---- Pending dues summary ----
  if (q.includes("due") || q.includes("overdue")) {
    const dues = pendingDuesSummary(bookings);
    return { text: `Pending dues: ${formatINR(dues.pending)}. Overdue: ${formatINR(dues.overdue)} across ${dues.overdueCount} milestone(s).` };
  }

  // ---- Default: business snapshot ----
  return {
    text: `Pipeline snapshot: ${formatINR(kpis.monthlyRevenue)} revenue this month, ${kpis.bookings} bookings, ${kpis.hotLeads} hot leads, ${kpis.conversionRate}% conversion across ${projects.length} projects. Ask me about a specific project, lead, payment, or task for more detail.`,
  };
}

/** Builds the full grounding context handed to OpenAI when a key is configured. */
export function buildFullBusinessContext(data: CrmSnapshot, orgName: string): string {
  const { leads, projects, bookings, brokerCommissions, constructionStages: _cs, tasks, complianceItems, salesReps, orgUsers, kpis, revenueForecast } = data;
  const dues = pendingDuesSummary(bookings);
  const alerts = getFollowUpAlerts(leads).slice(0, 5);
  const riskyBookings = bookings.map((b) => ({ b, risk: predictPaymentRisk(b) })).filter((x) => x.risk.tier !== "Low");
  const openTasks = tasks.filter((t) => t.status !== "Done");
  const urgentCompliance = complianceItems.filter((c) => c.status !== "Compliant");

  return `Aiventra AI CRM — full business snapshot for ${orgName}:

KPIs: revenue ${formatINR(kpis.monthlyRevenue)}, bookings ${kpis.bookings}, hot leads ${kpis.hotLeads}, conversion ${kpis.conversionRate}%.
Revenue forecast: next 7 days ${formatINR(revenueForecast.next7Days)}, next month ${formatINR(revenueForecast.nextMonth)}, next quarter ${formatINR(revenueForecast.nextQuarter)}.
Projects: ${projects.map((p) => `${p.name} (${p.soldUnits}/${p.totalUnits} sold, ${p.constructionProgress}% construction, possession ${p.possessionDate})`).join("; ") || "none yet"}.
Top hot leads: ${[...leads].sort((a, b) => b.score - a.score).slice(0, 6).map((l) => `${l.name} (score ${l.score}, ${l.stage}, ${l.interestedProject}, closing ${l.closingProbability}%)`).join("; ") || "none yet"}.
Going-cold alerts: ${alerts.map((a) => a.message).join("; ") || "none"}.
Pending dues: ${formatINR(dues.pending)} pending, ${formatINR(dues.overdue)} overdue across ${dues.overdueCount} milestones.
Payment risk: ${riskyBookings.map((x) => `${x.b.customerName} (${x.risk.tier}, score ${x.risk.riskScore})`).join("; ") || "no medium/high risk bookings"}.
Broker commissions pending: ${brokerCommissions.filter((c) => c.status === "Pending").map((c) => `${c.brokerName} ${formatINR(c.commissionAmount)}`).join("; ") || "none"}.
Open tasks: ${openTasks.map((t) => `${t.title} (${t.project}, ${t.priority}, due ${t.dueDateISO ? new Date(t.dueDateISO).toLocaleDateString("en-IN") : "—"})`).join("; ") || "none"}.
Compliance needing attention: ${urgentCompliance.map((c) => `${c.requirement} (${c.project}, ${c.status})`).join("; ") || "none"}.
Sales team: ${salesReps.map((r) => `${r.name} — ${r.bookingsClosed} bookings, ${r.conversionRate}% conversion`).join("; ") || "none yet"}.
Team: ${orgUsers.map((u) => `${u.name} (${u.role})`).join(", ") || "none yet"}.`;
}

