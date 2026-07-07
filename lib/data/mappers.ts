import {
  OrgUser,
  Project,
  UnitType,
  Lead,
  Customer,
  TimelineEvent,
  SiteVisit,
  Booking,
  PaymentMilestone,
  BrokerCommission,
  ConstructionStage,
  Task,
  SiteReport,
  ProjectDocument,
  ComplianceItem,
} from "@/lib/types";

const AVATAR_PALETTE = ["#FF6B00", "#111111", "#FF9152", "#B85C00", "#FFB37A", "#4A4A4A"];

export function colorForSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

// ---------------- Org users ----------------
export function mapOrgUser(row: any): OrgUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatarColor: colorForSeed(row.email ?? row.id),
    phone: row.phone ?? undefined,
    active: row.active,
  };
}

// ---------------- Projects ----------------
const GRADIENTS = [
  "from-[#FF6B00] to-[#FFB37A]",
  "from-[#111111] to-[#4A4A4A]",
  "from-[#FF6B00] to-[#111111]",
  "from-[#B85C00] to-[#FF9152]",
];

export function mapProject(row: any, unitStats: { total: number; sold: number; held: number; revenue: number }): Project {
  return {
    id: row.id,
    name: row.name,
    location: row.location ?? "",
    totalUnits: unitStats.total || row.total_units || 0,
    soldUnits: unitStats.sold,
    heldUnits: unitStats.held,
    towers: row.towers,
    floorsPerTower: row.floors_per_tower,
    constructionProgress: row.construction_progress,
    possessionDate: row.possession_date ?? "",
    revenueGenerated: unitStats.revenue,
    avgTicketSize: Number(row.avg_ticket_size ?? 0),
    configurations: row.configurations ?? [],
    coverGradient: GRADIENTS[Math.abs(hashCode(row.id)) % GRADIENTS.length],
    reraId: row.rera_id ?? "",
  };
}

function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

// ---------------- Units ----------------
export function mapUnit(row: any): UnitType {
  return {
    id: row.id,
    projectId: row.project_id,
    tower: row.tower,
    floor: row.floor,
    unitNo: row.unit_no,
    config: row.config,
    areaSqft: row.area_sqft,
    price: Number(row.price),
    status: row.status,
    facing: row.facing ?? "North",
  };
}

// ---------------- Leads ----------------
export function mapLead(row: any, projectNameById: Map<string, string>): Lead {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? "",
    email: row.email ?? "",
    source: row.source ?? "Website",
    city: row.city ?? "",
    budgetMin: Number(row.budget_min ?? 0),
    budgetMax: Number(row.budget_max ?? 0),
    interestedProject: projectNameById.get(row.interested_project_id ?? "") ?? "",
    configPreference: row.config_preference ?? "",
    stage: row.stage,
    score: row.score ?? 0,
    closingProbability: row.closing_probability ?? 0,
    assignedTo: row.assigned_to ?? "",
    lastContactedISO: row.last_contacted_at ?? row.created_at,
    createdISO: row.created_at,
    aiSuggestion: row.ai_suggestion ?? undefined,
    tags: [],
    facing: row.facing_preference ?? undefined,
    isInvestor: row.is_investor ?? false,
    responseSpeedHrs: Number(row.response_speed_hrs ?? 12),
    avgCallDurationMin: Number(row.avg_call_duration_min ?? 5),
    visitFrequency: row.visit_frequency ?? 0,
    interestScore: row.interest_score ?? 40,
  };
}

// ---------------- Customers ----------------
export function mapTimelineEvent(row: any): TimelineEvent {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description ?? "",
    dateISO: row.event_at,
  };
}

export function mapCustomer(row: any, timeline: TimelineEvent[]): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? "",
    email: row.email ?? "",
    city: row.city ?? "",
    type: row.type,
    budget: Number(row.budget ?? 0),
    interestedConfig: row.interested_config ?? "",
    facingPreference: row.facing_preference ?? "",
    aiSummary: row.ai_summary ?? "",
    timeline,
    linkedLeadId: row.linked_lead_id ?? undefined,
    avatarColor: colorForSeed(row.email ?? row.id),
  };
}

// ---------------- Site visits ----------------
export function mapSiteVisit(row: any, leadNameById: Map<string, string>, projectNameById: Map<string, string>, userNameById: Map<string, string>): SiteVisit {
  return {
    id: row.id,
    leadName: leadNameById.get(row.lead_id ?? "") ?? "Unknown lead",
    leadId: row.lead_id ?? "",
    project: projectNameById.get(row.project_id ?? "") ?? "",
    dateISO: row.scheduled_at,
    status: row.status,
    assignedTo: userNameById.get(row.assigned_to ?? "") ?? "Unassigned",
    notes: row.notes ?? undefined,
  };
}

// ---------------- Bookings ----------------
export function mapMilestone(row: any): PaymentMilestone {
  return {
    id: row.id,
    bookingId: row.booking_id,
    label: row.label,
    dueDateISO: row.due_date,
    amount: Number(row.amount),
    status: row.status,
    paidDateISO: row.paid_date ?? undefined,
  };
}

export function mapBooking(
  row: any,
  milestones: PaymentMilestone[],
  unitNoById: Map<string, string>,
  projectNameByUnitId: Map<string, string>,
  customerNameById: Map<string, string>
): Booking {
  return {
    id: row.id,
    unitNo: unitNoById.get(row.unit_id ?? "") ?? "",
    projectName: projectNameByUnitId.get(row.unit_id ?? "") ?? "",
    customerName: customerNameById.get(row.customer_id) ?? "Unknown",
    customerId: row.customer_id,
    bookedBy: row.booked_by ?? "",
    bookingAmount: Number(row.booking_amount),
    tokenAmount: Number(row.token_amount ?? 0),
    tokenPaid: row.token_paid ?? false,
    bookingDateISO: row.booking_date,
    status: row.status,
    brokerName: row.broker_name ?? undefined,
    milestones,
    missedMilestones: row.missed_milestones ?? 0,
    paymentConsistency: row.payment_consistency ?? 100,
    communicationResponsiveness: row.communication_responsiveness ?? 100,
  };
}

// ---------------- Broker commissions ----------------
export function mapBrokerCommission(row: any, projectNameByBookingId: Map<string, string>, amountByBookingId: Map<string, number>): BrokerCommission {
  return {
    id: row.id,
    brokerName: row.broker_name,
    bookingId: row.booking_id,
    projectName: projectNameByBookingId.get(row.booking_id) ?? "",
    bookingAmount: amountByBookingId.get(row.booking_id) ?? 0,
    commissionPct: Number(row.commission_pct),
    commissionAmount: Number(row.commission_amount),
    status: row.status,
    dueDateISO: row.due_date,
  };
}

// ---------------- Builder operations ----------------
export function mapConstructionStage(row: any, projectNameById: Map<string, string>): ConstructionStage {
  return {
    id: row.id,
    project: projectNameById.get(row.project_id) ?? "",
    stage: row.stage,
    plannedCompletionISO: row.planned_completion ?? "",
    actualCompletionISO: row.actual_completion ?? undefined,
    progress: row.progress,
    status: row.status,
  };
}

export function mapTask(row: any, projectNameById: Map<string, string>): Task {
  return {
    id: row.id,
    title: row.title,
    project: projectNameById.get(row.project_id ?? "") ?? "",
    assignedTo: row.assigned_to ?? "",
    dueDateISO: row.due_date ?? "",
    status: row.status,
    priority: row.priority,
  };
}

export function mapSiteReport(row: any, projectNameById: Map<string, string>): SiteReport {
  return {
    id: row.id,
    project: projectNameById.get(row.project_id ?? "") ?? "",
    engineer: row.engineer_id ?? "",
    dateISO: row.report_date,
    title: row.title,
    summary: row.summary ?? "",
    progressNoted: row.progress_noted ?? 0,
    issuesFlagged: row.issues_flagged ?? [],
  };
}

export function mapDocument(row: any, projectNameById: Map<string, string>, userNameById: Map<string, string>): ProjectDocument {
  return {
    id: row.id,
    name: row.name,
    project: projectNameById.get(row.project_id ?? "") ?? "",
    docType: row.doc_type ?? "",
    uploadedDateISO: row.uploaded_at,
    status: row.status,
    verifiedBy: row.verified_by ? userNameById.get(row.verified_by) : undefined,
  };
}

export function mapComplianceItem(row: any, projectNameById: Map<string, string>): ComplianceItem {
  return {
    id: row.id,
    project: projectNameById.get(row.project_id ?? "") ?? "",
    requirement: row.requirement,
    authority: row.authority ?? "",
    dueDateISO: row.due_date,
    status: row.status,
  };
}
