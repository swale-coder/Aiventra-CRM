"use client";

import { useMemo, useState } from "react";
import { UnitType } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { cn } from "@/lib/utils";

const statusColor: Record<UnitType["status"], string> = {
  Available: "bg-emerald-400 hover:bg-emerald-500",
  Held: "bg-amber-400 hover:bg-amber-500",
  Booked: "bg-blue-400 hover:bg-blue-500",
  Sold: "bg-black/20 hover:bg-black/30",
};

export function UnitHeatmap({ units, towers }: { units: UnitType[]; towers: string[] }) {
  const [tower, setTower] = useState(towers[0]);
  const [hovered, setHovered] = useState<UnitType | null>(null);

  const floors = useMemo(() => {
    const byFloor = new Map<number, UnitType[]>();
    units
      .filter((u) => u.tower === tower)
      .forEach((u) => {
        if (!byFloor.has(u.floor)) byFloor.set(u.floor, []);
        byFloor.get(u.floor)!.push(u);
      });
    return [...byFloor.entries()].sort((a, b) => b[0] - a[0]);
  }, [units, tower]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1.5">
          {towers.map((t) => (
            <button
              key={t}
              onClick={() => setTower(t)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                tower === t ? "bg-aiventra-ink text-white" : "bg-black/[0.05] text-black/50 hover:bg-black/[0.08]"
              )}
            >
              Tower {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-black/45">
          {Object.entries(statusColor).map(([status, color]) => (
            <span key={status} className="flex items-center gap-1.5">
              <span className={cn("h-2.5 w-2.5 rounded-sm", color.split(" ")[0])} />
              {status}
            </span>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="max-h-[420px] space-y-1 overflow-y-auto pr-1">
          {floors.map(([floor, floorUnits]) => (
            <div key={floor} className="flex items-center gap-2">
              <span className="w-8 shrink-0 text-right text-[11px] font-medium text-black/35">{floor}F</span>
              <div className="flex flex-1 gap-1">
                {floorUnits.map((u) => (
                  <button
                    key={u.id}
                    onMouseEnter={() => setHovered(u)}
                    onMouseLeave={() => setHovered(null)}
                    className={cn(
                      "h-7 flex-1 rounded-md transition-colors",
                      statusColor[u.status]
                    )}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {hovered && (
          <div className="pointer-events-none absolute bottom-2 right-2 rounded-xl border border-black/[0.06] bg-white p-3 text-xs shadow-lift">
            <p className="font-semibold text-aiventra-ink">Unit {hovered.unitNo}</p>
            <p className="text-black/45">{hovered.config} · {hovered.areaSqft} sqft · {hovered.facing}</p>
            <p className="mt-1 font-medium text-aiventra-orange">{formatINR(hovered.price)}</p>
            <p className="text-black/40">{hovered.status}</p>
          </div>
        )}
      </div>
    </div>
  );
}
