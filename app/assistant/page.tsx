"use client";

import { useRef, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/shared/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Sparkles, Send, Loader2, Flame, TrendingUp, IndianRupee, ShieldAlert, ListTodo, Users2 } from "lucide-react";
import { CopilotTable } from "@/lib/ai/copilot-engine";

interface ChatMsg {
  role: "user" | "ai";
  text: string;
  table?: CopilotTable;
}

const suggestions = [
  { icon: Flame, text: "Show hot leads for Skyline Heights" },
  { icon: TrendingUp, text: "Who is likely to close this week?" },
  { icon: IndianRupee, text: "Revenue forecast for next quarter" },
  { icon: IndianRupee, text: "Pending payments above 10 lakh" },
  { icon: ShieldAlert, text: "Which bookings have high payment default risk?" },
  { icon: ListTodo, text: "What tasks are still open?" },
  { icon: Users2, text: "Show me the sales leaderboard" },
  { icon: ShieldAlert, text: "Any overdue compliance items?" },
];

export default function AssistantPage() {
  return (
    <Suspense>
      <AssistantPageInner />
    </Suspense>
  );
}

function AssistantPageInner() {
  const { orgUser } = useAuth();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "ai",
      text: "Hi, I'm Aiventra Copilot. Ask me anything across leads, projects, bookings, payments, construction, tasks, or compliance — I'll answer from your real CRM data.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoSentRef = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !autoSentRef.current) {
      autoSentRef.current = true;
      send(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "ai", text: data.reply, table: data.table }]);
    } catch {
      setMessages((m) => [...m, { role: "ai", text: "I couldn't reach the Copilot service — please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold text-aiventra-ink">AI Assistant</h1>
        <p className="text-sm text-black/45">Phase 5 — Aiventra Copilot, grounded in every module</p>
      </div>

      <div className="flex h-[calc(100vh-220px)] min-h-[500px] flex-col overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-soft">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex items-start gap-2.5"}>
              {m.role === "ai" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-aiventra-orange">
                  <Sparkles size={13} className="text-white" />
                </div>
              )}
              <div className={m.role === "user" ? "max-w-[75%]" : "max-w-[85%]"}>
                <div
                  className={
                    m.role === "user"
                      ? "rounded-2xl rounded-tr-sm bg-aiventra-orange px-4 py-2.5 text-sm text-white"
                      : "rounded-2xl rounded-tl-sm bg-black/[0.04] px-4 py-2.5 text-sm text-aiventra-ink"
                  }
                >
                  {m.text}
                </div>
                {m.table && (
                  <div className="mt-2 overflow-hidden overflow-x-auto rounded-xl border border-black/[0.06]">
                    <table className="w-full whitespace-nowrap text-left text-xs">
                      <thead className="bg-black/[0.03] text-black/40">
                        <tr>
                          {m.table.headers.map((h) => (
                            <th key={h} className="px-3 py-2 font-medium">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {m.table.rows.map((row, ri) => (
                          <tr key={ri} className="border-t border-black/[0.05]">
                            {row.map((cell, ci) => (
                              <td key={ci} className="px-3 py-2 text-aiventra-ink">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              {m.role === "user" && <Avatar name={orgUser?.name || "You"} color={orgUser?.avatarColor || "#111111"} size={28} />}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-aiventra-orange">
                <Sparkles size={13} className="text-white" />
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-black/[0.04] px-4 py-2.5">
                <Loader2 size={14} className="animate-spin text-black/40" />
              </div>
            </div>
          )}

          {messages.length === 1 && (
            <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
              {suggestions.map((s) => (
                <button
                  key={s.text}
                  onClick={() => send(s.text)}
                  className="flex items-center gap-2.5 rounded-xl border border-black/[0.06] px-3.5 py-2.5 text-left text-sm font-medium text-aiventra-ink hover:border-aiventra-orange/30 hover:bg-aiventra-orange/5"
                >
                  <s.icon size={14} className="shrink-0 text-aiventra-orange" />
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
            placeholder="Ask Aiventra Copilot anything about your business…"
            className="flex-1 rounded-xl bg-black/[0.04] px-4 py-3 text-sm outline-none placeholder:text-black/35 focus:ring-2 focus:ring-aiventra-orange/30"
          />
          <button
            onClick={() => send(input)}
            disabled={loading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-aiventra-orange text-white transition-transform active:scale-95 disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </AppShell>
  );
}
