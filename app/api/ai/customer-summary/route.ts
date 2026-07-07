import { NextResponse } from "next/server";
import { generateCustomerSummary } from "@/lib/ai/recommend-unit";

export async function POST(req: Request) {
  const body = await req.json();
  const { type, city, budget, interestedConfig, facingPreference, name } = body ?? {};

  if (!type || !city || !budget || !interestedConfig) {
    return NextResponse.json({ error: "Missing required customer fields" }, { status: 400 });
  }

  const deterministicSummary = generateCustomerSummary({ type, city, budget, interestedConfig, facingPreference });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // No OpenAI key configured — return the on-device deterministic summary.
    return NextResponse.json({ summary: deterministicSummary, source: "deterministic" });
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You write a single terse one-sentence CRM summary for a real-estate lead, in the style: " +
              '"Investor from Ahmedabad, budget 1.2Cr, interested in 3BHK, prefers east-facing." No preamble.',
          },
          {
            role: "user",
            content: `Name: ${name ?? "Unknown"}. Type: ${type}. City: ${city}. Budget: ₹${budget}. Configuration: ${interestedConfig}. Facing preference: ${facingPreference ?? "none"}.`,
          },
        ],
        max_tokens: 80,
        temperature: 0.4,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ summary: deterministicSummary, source: "deterministic-fallback" });
    }

    const data = await res.json();
    const summary: string | undefined = data?.choices?.[0]?.message?.content?.trim();
    return NextResponse.json({ summary: summary || deterministicSummary, source: "openai" });
  } catch {
    return NextResponse.json({ summary: deterministicSummary, source: "deterministic-fallback" });
  }
}
