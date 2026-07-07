import * as React from "react";
import { cn } from "@/lib/utils";

const tones = {
  orange: "bg-[#FFF1E6] text-[#B85C00] border-[#FFD9B8]",
  ink: "bg-black/[0.05] text-aiventra-ink border-black/10",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  red: "bg-red-50 text-red-700 border-red-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  white: "bg-white/80 text-aiventra-ink border-black/10",
};

export function Badge({
  className,
  tone = "ink",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
