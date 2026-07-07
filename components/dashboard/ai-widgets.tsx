"use client";

import { Sparkles, ArrowUpRight, Flame, Clock } from "lucide-react";
import { useCrmData } from "@/lib/data/CrmDataProvider";
import { recommendUnits } from "@/lib/ai/recommend-unit";
import { timeAgo } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function AiRecommendations() {
  const { leads, units } = useCrmData();

  const recs: { icon: typeof Flame; title: string; detail: string }[] = [];

  const topLead = [...leads].filter((l) => l.stage !== "Won").sort((a, b) => b.score - a.score)[0];
  if (topLead) {
    const [match] = recommendUnits(topLead, units, 1);
    if (match) {
      recs.push({
        icon: Flame,
        title: `Suggest unit ${match.unit.unitNo} for ${topLead.name}`,
        detail: `${match.reasons.join(", ") || "Strong overall fit"} — closing probability ${topLead.closingProbability}%`,
      });
    }
  }

  const goingCold = [...leads]
    .filter((l) => l.score >= 55 && l.stage !== "Won")
    .sort((a, b) => new Date(a.lastContactedISO).getTime() - new Date(b.lastContactedISO).getTime())[0];
  if (goingCold) {
    recs.push({
      icon: Clock,
      title: `${goingCold.name} hasn't been contacted in a while`,
      detail: `Last contact ${timeAgo(goingCold.lastContactedISO)} — recommend a follow-up call today`,
    });
  }

  const negotiating = [...leads].filter((l) => l.stage === "Negotiation").sort((a, b) => b.closingProbability - a.closingProbability)[0];
  if (negotiating) {
    recs.push({
      icon: Sparkles,
      title: `Offer flexible milestones to ${negotiating.name}`,
      detail: `Closing signal detected — ${negotiating.closingProbability}% probability of closing this week`,
    });
  }

  if (recs.length === 0) {
    return <p className="py-6 text-center text-sm text-black/30">Recommendations will appear once you have leads.</p>;
  }

  return (
    <div className="space-y-3">
      {recs.map((r) => (
        <div key={r.title} className="flex items-start gap-3 rounded-2xl border border-aiventra-orange/[0.15] bg-gradient-to-br from-aiventra-orange/[0.04] to-transparent p-3.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-aiventra-orange/10">
            <r.icon size={14} className="text-aiventra-orange" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-snug text-aiventra-ink">{r.title}</p>
            <p className="mt-0.5 text-xs leading-snug text-black/45">{r.detail}</p>
          </div>
          <ArrowUpRight size={14} className="mt-1 shrink-0 text-black/25" />
        </div>
      ))}
    </div>
  );
}

export function HotLeadsList() {
  const { leads } = useCrmData();
  const hot = [...leads].sort((a, b) => b.score - a.score).slice(0, 5);

  if (hot.length === 0) {
    return <p className="py-6 text-center text-sm text-black/30">No leads yet.</p>;
  }

  return (
    <div className="space-y-1">
      {hot.map((l) => (
        <div key={l.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-black/[0.03]">
          <Avatar name={l.name} size={32} color="#FF6B00" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-aiventra-ink">{l.name}</p>
            <p className="truncate text-xs text-black/40">
              {l.interestedProject} · {l.configPreference}
            </p>
          </div>
          <Badge tone={l.score >= 80 ? "orange" : l.score >= 55 ? "amber" : "ink"}>{l.score}% match</Badge>
        </div>
      ))}
    </div>
  );
}
