"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Project } from "@/lib/types";
import { Building2, MapPin, TrendingUp } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

export function ProjectCard3D({ project, onClick }: { project: Project; onClick: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -10, y: x * 10 });
  }

  const soldPct = Math.round((project.soldUnits / project.totalUnits) * 100);

  return (
    <div style={{ perspective: 1200 }}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        onClick={onClick}
        animate={{ rotateX: tilt.x, rotateY: tilt.y }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="cursor-pointer overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-soft transition-shadow hover:shadow-lift"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className={`relative h-36 bg-gradient-to-br ${project.coverGradient} p-5`}>
          <div className="grain-overlay absolute inset-0 opacity-30" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                {project.towers} {project.towers > 1 ? "Towers" : "Tower"} · {project.floorsPerTower} Floors
              </span>
              <Building2 size={18} className="text-white/70" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-white">{project.name}</h3>
              <p className="flex items-center gap-1 text-xs text-white/70">
                <MapPin size={11} /> {project.location}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-black/45">Inventory sold</span>
            <span className="font-semibold text-aiventra-ink">{soldPct}%</span>
          </div>
          <Progress value={soldPct} />

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="font-display text-base font-bold text-aiventra-ink">{formatINR(project.revenueGenerated)}</p>
              <p className="text-[10px] text-black/40">Revenue</p>
            </div>
            <div>
              <p className="font-display text-base font-bold text-aiventra-ink">{project.constructionProgress}%</p>
              <p className="text-[10px] text-black/40">Construction</p>
            </div>
            <div>
              <p className="font-display text-base font-bold text-aiventra-ink">{project.totalUnits - project.soldUnits}</p>
              <p className="text-[10px] text-black/40">Available</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-black/[0.05] pt-3 text-xs">
            <span className="text-black/40">Possession {project.possessionDate}</span>
            <span className="flex items-center gap-1 font-medium text-emerald-600">
              <TrendingUp size={12} /> On track
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
