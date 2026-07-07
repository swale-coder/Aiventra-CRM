"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useCrmData } from "@/lib/data/CrmDataProvider";

export function RevenueChart() {
  const { revenueTrend } = useCrmData();
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={revenueTrend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF6B00" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#FF6B00" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "rgba(0,0,0,0.4)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "rgba(0,0,0,0.4)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}Cr`} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.06)", fontSize: 12 }}
          formatter={(v: number) => [`₹${v}Cr`, "Revenue"]}
        />
        <Area type="monotone" dataKey="revenue" stroke="#FF6B00" strokeWidth={2.5} fill="url(#revFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
