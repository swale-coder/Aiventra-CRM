import { NextResponse } from "next/server";

function deterministicReminder(customerName: string, label: string, amount: string, isOverdue: boolean, days: number) {
  return isOverdue
    ? `Hi ${customerName.split(" ")[0]}, your "${label}" payment of ${amount} was due ${days} day${days === 1 ? "" : "s"} ago. Please arrange payment at the earliest to avoid delays in your booking — let us know if you'd like to discuss a revised schedule.`
    : `Hi ${customerName.split(" ")[0]}, a friendly reminder that your "${label}" payment of ${amount} is due in ${days} day${days === 1 ? "" : "s"}. Reach out if you have any questions.`;
}

export async function POST(req: Request) {
  const { customerName, label, amount, isOverdue, days } = await req.json();
  if (!customerName || !label) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const fallback = deterministicReminder(customerName, label, amount, isOverdue, days ?? 0);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ message: fallback, source: "deterministic" });

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
              "You draft a short, polite payment reminder message (2-3 sentences) from a real estate builder to a customer. No preamble, just the message.",
          },
          {
            role: "user",
            content: `Customer: ${customerName}. Milestone: ${label}. Amount: ${amount}. Overdue: ${isOverdue}. Days: ${days}.`,
          },
        ],
        max_tokens: 120,
        temperature: 0.5,
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
