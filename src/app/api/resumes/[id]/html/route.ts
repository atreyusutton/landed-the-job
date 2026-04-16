import { notFound } from "next/navigation";
import { requireUser } from "@/lib/user";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await requireUser();
  const resume = await db.resume.findFirst({
    where: { id, userId: user.id },
    select: { html: true },
  });
  if (!resume) notFound();
  return new Response(resume.html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
