import { Booking, PaymentMilestone } from "@/lib/types";

export interface RiskFactor {
  label: string;
  normalized: number; // 0-100, higher = riskier
  weight: number;
  description: string;
}

export interface RiskResult {
  riskScore: number; // 0-100, higher = more likely to default
  tier: "Low" | "Medium" | "High";
  factors: RiskFactor[];
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function daysOverdue(milestones: PaymentMilestone[]): number {
  const now = Date.now();
  const overdue = milestones.filter((m) => m.status === "Overdue");
  if (overdue.length === 0) return 0;
  return Math.max(
    ...overdue.map((m) => Math.floor((now - new Date(m.dueDateISO).getTime()) / 86400000))
  );
}

/**
 * AI Payment Default Risk Prediction — Phase 3.
 *
 * Combines four weighted signals into a 0-100 risk score:
 *  - overdue days on any pending milestone (longer overdue = higher risk)
 *  - number of previously missed/late milestones on this booking
 *  - payment consistency history (0-100, higher = more reliable historically)
 *  - communication responsiveness (0-100, higher = easier to reach — low
 *    responsiveness compounds risk since it blocks recovery outreach)
 *
 * Same pattern as the Phase 2 lead-scoring engine: transparent, tunable weights,
 * every factor explained for the UI, and swappable for a live model later.
 */
export function predictPaymentRisk(booking: Booking): RiskResult {
  const overdueDays = daysOverdue(booking.milestones);

  const weights = { overdue: 0.4, missed: 0.25, consistency: 0.2, responsiveness: 0.15 };

  const overdueNorm = clamp((overdueDays / 30) * 100);
  const missedNorm = clamp((booking.missedMilestones / 3) * 100);
  const consistencyNorm = clamp(100 - booking.paymentConsistency);
  const responsivenessNorm = clamp(100 - booking.communicationResponsiveness);

  const factors: RiskFactor[] = [
    {
      label: "Overdue duration",
      normalized: overdueNorm,
      weight: weights.overdue,
      description: overdueDays > 0 ? `${overdueDays} days overdue on a milestone` : "No overdue milestones",
    },
    {
      label: "Missed milestones",
      normalized: missedNorm,
      weight: weights.missed,
      description: `${booking.missedMilestones} missed/late milestone${booking.missedMilestones === 1 ? "" : "s"} historically`,
    },
    {
      label: "Payment consistency",
      normalized: consistencyNorm,
      weight: weights.consistency,
      description: `${booking.paymentConsistency}/100 on-time payment history`,
    },
    {
      label: "Responsiveness",
      normalized: responsivenessNorm,
      weight: weights.responsiveness,
      description: `${booking.communicationResponsiveness}/100 responsiveness to outreach`,
    },
  ];

  const riskScore = Math.round(factors.reduce((sum, f) => sum + f.normalized * f.weight, 0));
  const tier: RiskResult["tier"] = riskScore >= 60 ? "High" : riskScore >= 30 ? "Medium" : "Low";

  return { riskScore, tier, factors };
}

/** Pending dues across all bookings — sum of unpaid milestone amounts, with overdue split out. */
export function pendingDuesSummary(bookings: Booking[]) {
  let pending = 0;
  let overdue = 0;
  let overdueCount = 0;

  for (const b of bookings) {
    for (const m of b.milestones) {
      if (m.status === "Pending") pending += m.amount;
      if (m.status === "Overdue") {
        overdue += m.amount;
        overdueCount += 1;
      }
    }
  }

  return { pending, overdue, total: pending + overdue, overdueCount };
}

/** Auto Reminders — every pending/overdue milestone that needs a nudge, most urgent first. */
export interface ReminderItem {
  booking: Booking;
  milestone: PaymentMilestone;
  daysUntilOrOverdue: number;
  isOverdue: boolean;
}

export function getAutoReminders(bookings: Booking[]): ReminderItem[] {
  const now = Date.now();
  const items: ReminderItem[] = [];

  for (const b of bookings) {
    for (const m of b.milestones) {
      if (m.status === "Paid") continue;
      const days = Math.floor((new Date(m.dueDateISO).getTime() - now) / 86400000);
      items.push({ booking: b, milestone: m, daysUntilOrOverdue: Math.abs(days), isOverdue: days < 0 || m.status === "Overdue" });
    }
  }

  return items.sort((a, b) => {
    if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
    return a.isOverdue ? b.daysUntilOrOverdue - a.daysUntilOrOverdue : a.daysUntilOrOverdue - b.daysUntilOrOverdue;
  });
}
