"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "default",
  index = 0,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: LucideIcon;
  tone?: "default" | "orange";
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5 shadow-soft",
        tone === "orange"
          ? "border-transparent bg-gradient-to-br from-aiventra-orange to-[#FF8A3D] text-white"
          : "border-black/[0.06] bg-white text-aiventra-ink"
      )}
    >
      <div className="flex items-start justify-between">
        <span className={cn("text-xs font-medium", tone === "orange" ? "text-white/75" : "text-black/45")}>
          {label}
        </span>
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-xl",
            tone === "orange" ? "bg-white/15" : "bg-aiventra-orange/10"
          )}
        >
          <Icon size={15} className={tone === "orange" ? "text-white" : "text-aiventra-orange"} />
        </div>
      </div>
      <p className="mt-3 font-display text-[26px] font-bold leading-none">{value}</p>
      {delta && (
        <p className={cn("mt-2 text-xs font-medium", tone === "orange" ? "text-white/80" : "text-emerald-600")}>
          {delta}
        </p>
      )}
    </motion.div>
  );
}
