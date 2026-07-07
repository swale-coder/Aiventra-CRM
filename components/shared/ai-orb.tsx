"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, Send, TrendingUp, Flame, IndianRupee, Maximize2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

const suggestions = [
  { icon: Flame, text: "Show hot leads for Skyline Heights" },
  { icon: TrendingUp, text: "Who is likely to close this week?" },
  { icon: IndianRupee, text: "Revenue forecast for July?" },
];

interface ChatMsg {
  role: "user" | "ai";
  text: string;
}

const responses: Record<string, string> = {
  "show hot leads for skyline heights":
    "3 hot leads for Skyline Heights: Rahul Sharma (92) — negotiation, going cold for 4 days. Meera Iyer (88) — visit scheduled tomorrow. Om Prakash Jaiswal (71) — investor, visit scheduled.",
  "who is likely to close this week?":
    "Rahul Sharma (92% probability) and Farhan Sheikh (77%) are most likely to close this week — both are in negotiation with recent positive signals.",
  "revenue forecast for july?":
    "Based on current pipeline velocity, July is projected at ₹5.1Cr — up 6% from June's ₹4.8Cr, driven by 22 leads in negotiation across all 3 projects.",
};

export function AiOrb() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "ai", text: "Hi, I'm Aiventra Copilot. Ask me about leads, revenue, or bookings across your projects." },
  ]);

  function send(text: string) {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    const key = text.toLowerCase().trim();

    fetch("/api/ai/copilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setMessages((m) => [...m, { role: "ai", text: data.reply }]);
      })
      .catch(() => {
        const reply =
          responses[key] ||
          "Here's what I found: pipeline is healthy with 138 hot leads and 72% conversion this month. Ask me about a specific project or lead for more detail.";
        setMessages((m) => [...m, { role: "ai", text: reply }]);
      });
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", damping: 24, stiffness: 300 }}
            className="fixed bottom-24 right-5 z-50 flex h-[520px] w-[92vw] max-w-sm flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/95 shadow-lift backdrop-blur-xl sm:right-6"
          >
            <div className="flex items-center justify-between border-b border-black/[0.06] bg-aiventra-ink px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-aiventra-orange">
                  <Sparkles size={15} className="text-white" />
                </div>
                <div>
                  <p className="font-display text-sm font-semibold text-white">Aiventra Copilot</p>
                  <p className="text-[11px] text-white/50">Ask anything about your business</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Link href="/assistant" onClick={() => setOpen(false)} className="text-white/60 hover:text-white" title="Open full AI Assistant">
                  <Maximize2 size={15} />
                </Link>
                <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : "flex items-start gap-2"}>
                  {m.role === "ai" && <Avatar name="AI" color="#FF6B00" size={24} />}
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[80%] rounded-2xl rounded-tr-sm bg-aiventra-orange px-3.5 py-2.5 text-sm text-white"
                        : "max-w-[80%] rounded-2xl rounded-tl-sm bg-black/[0.04] px-3.5 py-2.5 text-sm text-aiventra-ink"
                    }
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {messages.length === 1 && (
                <div className="space-y-1.5 pt-2">
                  {suggestions.map((s) => (
                    <button
                      key={s.text}
                      onClick={() => send(s.text)}
                      className="flex w-full items-center gap-2.5 rounded-xl border border-black/[0.06] px-3 py-2.5 text-left text-xs font-medium text-aiventra-ink hover:border-aiventra-orange/30 hover:bg-aiventra-orange/5"
                    >
                      <s.icon size={14} className="text-aiventra-orange" />
                      {s.text}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 border-t border-black/[0.06] p-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send(input)}
                placeholder="Ask Aiventra Copilot…"
                className="flex-1 rounded-xl bg-black/[0.04] px-3.5 py-2.5 text-sm outline-none placeholder:text-black/35 focus:ring-2 focus:ring-aiventra-orange/30"
              />
              <button
                onClick={() => send(input)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-aiventra-orange text-white transition-transform active:scale-95"
              >
                <Send size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-6 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-aiventra-orange to-[#FF9152] text-white shadow-glow animate-pulseGlow sm:right-6"
        aria-label="Open Aiventra Copilot"
      >
        <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 2.4, repeat: Infinity }}>
          <Sparkles size={22} />
        </motion.div>
      </motion.button>
    </>
  );
}
