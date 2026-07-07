export type Role = "Owner" | "Admin" | "Sales Manager" | "Sales Executive" | "Site Engineer";

export interface OrgUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarColor: string;
  phone?: string;
  active: boolean;
}

export interface Organization {
  name: string;
  legalName: string;
  logoInitial: string;
  gstin: string;
  reraId: string;
  city: string;
  foundedYear: number;
  activeProjects: number;
  teamSize: number;
}

export type LeadStage =
  | "New"
  | "Contacted"
  | "Interested"
  | "Visit Scheduled"
  | "Negotiation"
  | "Won"
  | "Lost";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: "Website" | "Referral" | "Walk-in" | "99acres" | "MagicBricks" | "Instagram Ads" | "Broker";
  city: string;
  budgetMin: number;
  budgetMax: number;
  interestedProject: string;
  configPreference: string;
  stage: LeadStage;
  score: number; // 0-100 AI hot lead score (derived — see lib/ai/lead-scoring.ts)
  closingProbability: number; // % (derived)
  assignedTo: string; // OrgUser id
  lastContactedISO: string;
  createdISO: string;
  aiSuggestion?: string;
  tags: string[];
  facing?: string;
  isInvestor?: boolean;
  // Phase 2 — raw AI Hot Lead Scoring inputs
  responseSpeedHrs: number; // avg hours to respond to outreach (lower is better)
  avgCallDurationMin: number; // avg call length in minutes (higher signals engagement)
  visitFrequency: number; // number of site visits completed
  interestScore: number; // 0-100 engagement/sentiment signal from calls & messages
}

export interface UnitType {
  id: string;
  projectId: string;
  tower: string;
  floor: number;
  unitNo: string;
  config: string; // 2BHK, 3BHK
  areaSqft: number;
  price: number;
  status: "Available" | "Held" | "Booked" | "Sold";
  facing: "North" | "South" | "East" | "West" | "North-East" | "South-East";
}

export interface Project {
  id: string;
  name: string;
  location: string;
  totalUnits: number;
  soldUnits: number;
  heldUnits: number;
  towers: number;
  floorsPerTower: number;
  constructionProgress: number; // %
  possessionDate: string;
  revenueGenerated: number;
  avgTicketSize: number;
  configurations: string[];
  coverGradient: string;
  reraId: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  type: "End User" | "Investor";
  budget: number;
  interestedConfig: string;
  facingPreference: string;
  aiSummary: string;
  timeline: TimelineEvent[];
  linkedLeadId?: string;
  avatarColor: string;
}

export interface TimelineEvent {
  id: string;
  type: "call" | "visit" | "whatsapp" | "document" | "payment" | "email";
  title: string;
  description: string;
  dateISO: string;
}

export interface SiteVisit {
  id: string;
  leadName: string;
  leadId: string;
  project: string;
  dateISO: string;
  status: "Scheduled" | "Completed" | "Cancelled" | "No Show";
  assignedTo: string;
  notes?: string;
}

export interface SalesRep {
  id: string;
  name: string;
  avatarColor: string;
  leadsAssigned: number;
  visitsCompleted: number;
  bookingsClosed: number;
  revenueGenerated: number;
  conversionRate: number;
  rank: number;
}

// ---------------- Phase 3: Financial System ----------------

export type MilestoneStatus = "Paid" | "Pending" | "Overdue";

export interface PaymentMilestone {
  id: string;
  bookingId: string;
  label: string;
  dueDateISO: string;
  amount: number;
  status: MilestoneStatus;
  paidDateISO?: string;
}

export interface Booking {
  id: string;
  unitNo: string;
  projectName: string;
  customerName: string;
  customerId: string;
  bookedBy: string; // OrgUser id
  bookingAmount: number;
  tokenAmount: number;
  tokenPaid: boolean;
  bookingDateISO: string;
  status: "Confirmed" | "Cancelled" | "Completed";
  brokerName?: string;
  milestones: PaymentMilestone[];
  // AI Payment Default Risk inputs
  missedMilestones: number;
  paymentConsistency: number; // 0-100, higher = more consistent history
  communicationResponsiveness: number; // 0-100
}

export interface BrokerCommission {
  id: string;
  brokerName: string;
  bookingId: string;
  projectName: string;
  bookingAmount: number;
  commissionPct: number;
  commissionAmount: number;
  status: "Pending" | "Paid";
  dueDateISO: string;
}

// ---------------- Phase 4: Builder Operations ----------------

export type ConstructionStageStatus = "Completed" | "In Progress" | "Upcoming" | "Delayed";

export interface ConstructionStage {
  id: string;
  project: string;
  stage: string;
  plannedCompletionISO: string;
  actualCompletionISO?: string;
  progress: number; // 0-100
  status: ConstructionStageStatus;
}

export type TaskStatus = "To Do" | "In Progress" | "Done";
export type TaskPriority = "Low" | "Medium" | "High";

export interface Task {
  id: string;
  title: string;
  project: string;
  assignedTo: string; // OrgUser id
  dueDateISO: string;
  status: TaskStatus;
  priority: TaskPriority;
}

export interface SiteReport {
  id: string;
  project: string;
  engineer: string; // OrgUser id
  dateISO: string;
  title: string;
  summary: string;
  progressNoted: number; // %
  issuesFlagged: string[];
}

export type DocumentStatus = "Verified" | "Pending" | "Rejected";

export interface ProjectDocument {
  id: string;
  name: string;
  project: string;
  docType: string;
  uploadedDateISO: string;
  status: DocumentStatus;
  verifiedBy?: string;
}

export type ComplianceStatus = "Compliant" | "Due Soon" | "Overdue";

export interface ComplianceItem {
  id: string;
  project: string;
  requirement: string;
  authority: string;
  dueDateISO: string;
  status: ComplianceStatus;
}
