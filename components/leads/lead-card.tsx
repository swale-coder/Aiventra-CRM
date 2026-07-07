"use client";

import { Lead } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatINR, timeAgo } from "@/lib/utils";
import { Sparkles, MapPin } from "lucide-react";
import { useCrmData } from "@/lib/data/CrmDataProvider";
import { motion } from "framer-motion";

export function LeadCard({ lead, index }: { lead: Lead; index: number }) {
  const { orgUsers } = useCrmData();
  const rep = orgUsers.find((u) => u.id === lead.assignedTo);
  const scoreTone = lead.score >= 80 ? "orange" : lead.score >= 55 ? "amber" : "ink";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      whileHover={{ y: -2 }}
      className="cursor-pointer rounded-2xl border border-black/[0.06] bg-white p-3.5 shadow-soft transition-shadow hover:shadow-lift"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Avatar name={lead.name} size={30} color={rep?.avatarColor} />
          <div>
            <p className="text-sm font-semibold leading-tight text-aiventra-ink">{lead.name}</p>
            <p className="flex items-center gap-1 text-[11px] text-black/40">
              <MapPin size={10} /> {lead.city}
            </p>
          </div>
        </div>
        <Badge tone={scoreTone}>{lead.score}</Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-black/50">
        <span className="rounded-md bg-black/[0.04] px-1.5 py-0.5">{lead.interestedProject}</span>
        <span className="rounded-md bg-black/[0.04] px-1.5 py-0.5">{lead.configPreference}</span>
        <span className="rounded-md bg-black/[0.04] px-1.5 py-0.5">{formatINR(lead.budgetMax)}</span>
      </div>

      {lead.aiSuggestion && (
        <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-aiventra-orange/[0.06] p-2 text-[11px] leading-snug text-[#B85C00]">
          <Sparkles size={11} className="mt-0.5 shrink-0" />
          {lead.aiSuggestion}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-black/[0.05] pt-2.5">
        <span className="text-[11px] text-black/35">Last contact: {timeAgo(lead.lastContactedISO)}</span>
        <span className="text-[11px] font-semibold text-aiventra-orange">{lead.closingProbability}% close</span>
      </div>
    </motion.div>
  );
}
