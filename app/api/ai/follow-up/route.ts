import { NextResponse } from "next/server";

function deterministicFollowUp(name: string, project: string, daysSinceContact: number, stage: string) {
  return `Hi ${name.split(" ")[0]}, following up on your interest in ${project} — it's been ${daysSinceContact} days since we last spoke. You were at the "${stage}" stage; happy to answer any questions or set up another site visit whenever works for you.`;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, project, daysSinceContact, stage } = body ?? {};

  if (!name || !project) {
    return NextResponse.json({ error: "Missing lead name/project" }, { status: 400 });
  }

  const fallback = deterministicFollowUp(name, project, daysSinceContact ?? 3, stage ?? "New");
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ message: fallback, source: "deterministic" });
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
            content:
              "You draft a short, warm WhatsApp follow-up message (2-3 sentences max) from a real estate sales executive to a lead who has gone quiet. No preamble, just the message.",
          },
          {
            role: "user",
            content: `Lead name: ${name}. Project: ${project}. Days since last contact: ${daysSinceContact}. Pipeline stage: ${stage}.`,
          },
        ],
        max_tokens: 120,
        temperature: 0.6,
      }),
    });

    if (!res.ok) return NextResponse.json({ message: fallback, source: "deterministic-fallback" });

    const data = await res.json();
    const message: string | undefined = data?.choices?.[0]?.message?.content?.trim();
    return NextResponse.json({ message: message || fallback, source: "openai" });
  } catch {
    return NextResponse.json({ message: fallback, source: "deterministic-fallback" });
  }
}
