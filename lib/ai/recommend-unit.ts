import { Lead, Customer, UnitType } from "@/lib/types";
import { formatINR } from "@/lib/utils";

export interface UnitMatch {
  unit: UnitType;
  matchScore: number; // 0-100
  reasons: string[];
}

/**
 * AI Sales Recommendations — Phase 2.
 * Ranks available units for a given lead against budget fit, configuration match,
 * and facing preference, returning the top matches with human-readable reasons.
 */
export function recommendUnits(
  lead: Pick<Lead, "budgetMin" | "budgetMax" | "configPreference" | "facing">,
  units: UnitType[],
  topN = 3
): UnitMatch[] {
  const candidates = units.filter((u) => u.status === "Available");

  const scored = candidates.map((unit) => {
    let score = 0;
    const reasons: string[] = [];

    // Budget fit (0-50 pts): closer to budget midpoint scores higher
    const mid = (lead.budgetMin + lead.budgetMax) / 2;
    const budgetDeviation = Math.abs(unit.price - mid) / mid;
    const inRange = unit.price >= lead.budgetMin * 0.92 && unit.price <= lead.budgetMax * 1.08;
    const budgetPts = inRange ? Math.round(50 - Math.min(budgetDeviation, 1) * 30) : Math.round(20 - Math.min(budgetDeviation, 1) * 20);
    score += Math.max(0, budgetPts);
    if (inRange) reasons.push(`within ${formatINR(lead.budgetMin)}–${formatINR(lead.budgetMax)} budget`);

    // Configuration match (0-30 pts)
    if (unit.config === lead.configPreference) {
      score += 30;
      reasons.push(`matches ${lead.configPreference} preference`);
    }

    // Facing match (0-20 pts)
    if (lead.facing && unit.facing.toLowerCase().includes(lead.facing.toLowerCase())) {
      score += 20;
      reasons.push(`${unit.facing}-facing as preferred`);
    }

    return { unit, matchScore: Math.min(100, score), reasons };
  });

  return scored
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, topN)
    .filter((m) => m.matchScore > 0);
}

/**
 * Customer Summary Generator — Phase 2.
 * Produces a one-line AI summary from structured lead/customer data, in the same
 * style as: "Investor from Ahmedabad, budget 1.2Cr, interested in 3BHK, prefers east-facing."
 * This deterministic version runs with zero external calls; see
 * app/api/ai/customer-summary/route.ts for the OpenAI-backed version used when
 * OPENAI_API_KEY is configured.
 */
export function generateCustomerSummary(c: {
  type: Customer["type"];
  city: string;
  budget: number;
  interestedConfig: string;
  facingPreference?: string;
}): string {
  const persona = c.type === "Investor" ? "Investor" : "End user";
  const budgetStr = formatINR(c.budget);
  const facing = c.facingPreference ? `, prefers ${c.facingPreference.toLowerCase()}-facing` : "";
  return `${persona} from ${c.city}, budget ${budgetStr}, interested in ${c.interestedConfig}${facing}.`;
}
