import { NextResponse } from "next/server";
import { requireUser } from "@/lib/user";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// Free micro-tool: does NOT consume credits.
export async function POST(req: Request) {
  const user = await requireUser();
  const rl = rateLimit(`improve:${user.id}`, { max: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Rate limited. Try again in ${rl.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  let body: { text?: string; jobContext?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: "Provide text" }, { status: 400 });
  }
  if (text.length > 600) {
    return NextResponse.json(
      { error: "Bullet too long (600 char max)" },
      { status: 400 },
    );
  }

  const res = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `Rewrite this resume bullet to be stronger: more specific, active voice, concrete outcome. Keep it ONE LINE, no period at the end, do not invent facts.${
          body.jobContext ? `\n\nFor context, the bullet is going on a resume tailored to: ${body.jobContext}` : ""
        }\n\nBullet: ${text}\n\nReturn only the rewritten bullet, nothing else.`,
      },
    ],
  });

  const out = res.content
    .map((c) => (c.type === "text" ? c.text : ""))
    .join("")
    .trim()
    .replace(/^["']|["']$/g, "");

  return NextResponse.json({ bullet: out });
}
