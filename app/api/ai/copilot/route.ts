import { NextResponse } from "next/server";
import { answerCopilotQuery, buildFullBusinessContext } from "@/lib/ai/copilot-engine";
import { getAppSession } from "@/lib/auth/session";
import { buildServerSnapshot } from "@/lib/data/server-snapshot";

export async function POST(req: Request) {
  const { message } = await req.json();
  if (!message) return NextResponse.json({ error: "Missing message" }, { status: 400 });

  const session = await getAppSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const snapshot = await buildServerSnapshot(session.orgUser.orgId);

  // Always compute the deterministic, data-grounded answer first — this is what
  // renders (with any structured table) when there's no OpenAI key, and it's
  // also handed to the model below as grounding context so it can't invent
  // numbers that aren't actually in the CRM.
  const deterministic = answerCopilotQuery(message, snapshot);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ reply: deterministic.text, table: deterministic.table, source: "deterministic" });
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are Aiventra Copilot, an AI assistant embedded across every module of a real estate builder's CRM (leads, projects, bookings, payments, construction, tasks, compliance, sales team). Answer concisely (2-4 sentences) using ONLY the data below — never invent numbers not present here. A rule-based engine has already computed a grounded answer for this exact question; use it as your source of truth and phrase it naturally.\n\nEngine's grounded answer: "${deterministic.text}"\n\nFull business context:\n${buildFullBusinessContext(snapshot, session.organization.name)}`,
          },
          { role: "user", content: message },
        ],
        max_tokens: 220,
        temperature: 0.3,
      }),
    });

    if (!res.ok) return NextResponse.json({ reply: deterministic.text, table: deterministic.table, source: "deterministic-fallback" });

    const data = await res.json();
    const reply: string | undefined = data?.choices?.[0]?.message?.content?.trim();
    return NextResponse.json({ reply: reply || deterministic.text, table: deterministic.table, source: "openai" });
  } catch {
    return NextResponse.json({ reply: deterministic.text, table: deterministic.table, source: "deterministic-fallback" });
  }
}
