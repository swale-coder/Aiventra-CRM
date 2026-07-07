"use client";

import { motion } from "framer-motion";
import { useCrmData } from "@/lib/data/CrmDataProvider";

export function LeadFunnel() {
  const { leadFunnel } = useCrmData();
  const max = Math.max(1, ...leadFunnel.map((f) => f.count));
  return (
    <div className="space-y-2.5">
      {leadFunnel.map((f, i) => {
        const pct = (f.count / max) * 100;
        return (
          <div key={f.stage} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-xs font-medium text-black/50">{f.stage}</span>
            <div className="h-7 flex-1 overflow-hidden rounded-lg bg-black/[0.04]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, delay: i * 0.07, ease: "easeOut" }}
                className="flex h-full items-center justify-end rounded-lg bg-gradient-to-r from-[#FFB37A] to-aiventra-orange px-2.5"
                style={{ minWidth: 36 }}
              >
                <span className="text-xs font-semibold text-white">{f.count}</span>
              </motion.div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
