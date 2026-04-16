import { notFound } from "next/navigation";
import { requireUser } from "@/lib/user";
import { db } from "@/lib/db";
import { renderCoverLetterFromContent } from "@/lib/coverLetterTemplate";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await requireUser();
  const cl = await db.coverLetter.findFirst({
    where: { id, userId: user.id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
          location: true,
          linkedin: true,
          portfolio: true,
        },
      },
    },
  });
  if (!cl) notFound();
  const html = renderCoverLetterFromContent(cl.user, cl.content);
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
