"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, CalendarCheck2, IndianRupee } from "lucide-react";

const events = [
  { icon: Flame, text: "Hot lead alert — Rahul Sharma (92)", tone: "text-aiventra-orange" },
  { icon: IndianRupee, text: "New booking — Skyline Heights B-1402", tone: "text-emerald-500" },
  { icon: CalendarCheck2, text: "Site visit in 45 min — Meera Iyer", tone: "text-blue-500" },
];

export function ActivityIsland() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % events.length), 4200);
    return () => clearInterval(t);
  }, []);

  const Event = events[idx];
  const Icon = Event.icon;

  return (
    <div className="glass-dark flex h-9 min-w-[280px] items-center justify-center gap-2.5 rounded-full px-4 shadow-lift">
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-2 text-xs font-medium text-white"
        >
          <Icon size={13} className={Event.tone} />
          {Event.text}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
