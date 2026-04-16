import { NextResponse } from "next/server";
import { requireUser } from "@/lib/user";
import { db } from "@/lib/db";
import { parseJobUrl } from "@/lib/parseJobListing";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const url = body.url?.trim();
  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: "Provide a valid URL." }, { status: 400 });
  }

  const user = await requireUser();
  const rl = rateLimit(`import:${user.id}`, { max: 20, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Rate limited. Try again in ${rl.retryAfter}s.` },
      { status: 429 },
    );
  }

  try {
    const parsed = await parseJobUrl(url);
    const job = await db.job.create({
      data: {
        userId: user.id,
        title: parsed.title,
        company: parsed.company,
        description: parsed.description,
        requirements: parsed.requirements,
        location: parsed.location,
        salary: parsed.salary,
        url,
        source: parsed.source,
      },
    });
    return NextResponse.json({ id: job.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to import" },
      { status: 422 },
    );
  }
}
