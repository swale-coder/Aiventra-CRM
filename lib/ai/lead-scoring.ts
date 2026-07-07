import { Lead } from "@/lib/types";

export interface ScoringFactor {
  label: string;
  weight: number; // 0-1, share of the final score
  rawValue: number; // the input value, for display
  normalized: number; // 0-100, this factor's contribution before weighting
  description: string;
}

export interface ScoringResult {
  score: number; // 0-100 overall hot-lead score
  closingProbability: number; // %
  factors: ScoringFactor[];
  tier: "Hot" | "Warm" | "Cool" | "Cold";
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

/**
 * AI Hot Lead Scoring — Phase 2.
 *
 * Combines five weighted signals into a single 0-100 score:
 *  - response speed (faster reply = hotter lead)
 *  - average call duration (longer, engaged calls score higher)
 *  - budget match (how well the lead's budget aligns with the unit/project price band)
 *  - visit frequency (more completed site visits = stronger intent)
 *  - interest score (engagement/sentiment signal from calls & messages)
 *
 * This is a transparent, tunable weighted model rather than a black box — every
 * factor and its contribution is returned so the UI can explain *why* a lead is hot.
 * Swap `computeLeadScore` for a call to an LLM/ML endpoint later without changing
 * any calling code, since the return shape stays the same.
 */
export function computeLeadScore(input: {
  responseSpeedHrs: number;
  avgCallDurationMin: number;
  budgetMin: number;
  budgetMax: number;
  projectAvgTicket: number;
  visitFrequency: number;
  interestScore: number;
}): ScoringResult {
  const weights = {
    responseSpeed: 0.2,
    callDuration: 0.15,
    budgetMatch: 0.25,
    visitFrequency: 0.15,
    interest: 0.25,
  };

  // Response speed: <1hr = 100, 24hr+ = ~10
  const responseNorm = clamp(100 - input.responseSpeedHrs * 4);

  // Call duration: 20+ min = 100, 0 min = 0
  const callNorm = clamp((input.avgCallDurationMin / 20) * 100);

  // Budget match: how close the lead's budget band is to the project's average ticket size
  const midBudget = (input.budgetMin + input.budgetMax) / 2;
  const deviation = Math.abs(midBudget - input.projectAvgTicket) / input.projectAvgTicket;
  const budgetNorm = clamp(100 - deviation * 140);

  // Visit frequency: 3+ visits = 100
  const visitNorm = clamp((input.visitFrequency / 3) * 100);

  // Interest score passed through directly (already 0-100)
  const interestNorm = clamp(input.interestScore);

  const factors: ScoringFactor[] = [
    {
      label: "Response speed",
      weight: weights.responseSpeed,
      rawValue: input.responseSpeedHrs,
      normalized: responseNorm,
      description: `Avg. ${input.responseSpeedHrs}h to respond`,
    },
    {
      label: "Call duration",
      weight: weights.callDuration,
      rawValue: input.avgCallDurationMin,
      normalized: callNorm,
      description: `Avg. ${input.avgCallDurationMin} min per call`,
    },
    {
      label: "Budget match",
      weight: weights.budgetMatch,
      rawValue: midBudget,
      normalized: budgetNorm,
      description: `${Math.round((1 - deviation) * 100)}% aligned with project pricing`,
    },
    {
      label: "Visit frequency",
      weight: weights.visitFrequency,
      rawValue: input.visitFrequency,
      normalized: visitNorm,
      description: `${input.visitFrequency} site visit${input.visitFrequency === 1 ? "" : "s"} completed`,
    },
    {
      label: "Interest signal",
      weight: weights.interest,
      rawValue: input.interestScore,
      normalized: interestNorm,
      description: `${input.interestScore}/100 engagement & sentiment`,
    },
  ];

  const score = Math.round(factors.reduce((sum, f) => sum + f.normalized * f.weight, 0));
  // Closing probability skews the raw score using an S-curve so mid-range scores
  // compress and only strongly-qualified leads reach 90%+.
  const closingProbability = Math.round(clamp(100 / (1 + Math.exp(-0.09 * (score - 55)))));

  const tier: ScoringResult["tier"] = score >= 80 ? "Hot" : score >= 60 ? "Warm" : score >= 35 ? "Cool" : "Cold";

  return { score, closingProbability, factors, tier };
}

/** Recomputes score + closingProbability on a Lead using its own stored signal inputs. */
export function scoreLead(lead: Lead, projectAvgTicket: number): ScoringResult {
  return computeLeadScore({
    responseSpeedHrs: lead.responseSpeedHrs,
    avgCallDurationMin: lead.avgCallDurationMin,
    budgetMin: lead.budgetMin,
    budgetMax: lead.budgetMax,
    projectAvgTicket,
    visitFrequency: lead.visitFrequency,
    interestScore: lead.interestScore,
  });
}

/** Smart Follow-up Engine — flags leads that are going cold and need attention. */
export interface FollowUpAlert {
  lead: Lead;
  daysSinceContact: number;
  severity: "urgent" | "warning";
  message: string;
}

export function getFollowUpAlerts(leads: Lead[]): FollowUpAlert[] {
  const now = Date.now();
  return leads
    .filter((l) => l.stage !== "Won" && l.stage !== "Lost")
    .map((l) => {
      const days = Math.floor((now - new Date(l.lastContactedISO).getTime()) / 86400000);
      return { lead: l, daysSinceContact: days };
    })
    .filter((x) => x.daysSinceContact >= 3)
    .map((x) => ({
      lead: x.lead,
      daysSinceContact: x.daysSinceContact,
      severity: (x.lead.score >= 70 ? "urgent" : "warning") as "urgent" | "warning",
      message:
        x.lead.score >= 70
          ? `${x.lead.name} hasn't been contacted in ${x.daysSinceContact} days — high-intent lead going cold`
          : `${x.lead.name} hasn't been contacted in ${x.daysSinceContact} days`,
    }))
    .sort((a, b) => b.lead.score - a.lead.score);
}
