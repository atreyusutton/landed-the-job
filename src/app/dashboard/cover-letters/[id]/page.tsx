import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/user";
import { db } from "@/lib/db";
import { CoverLetterEditor } from "./CoverLetterEditor";
import { deleteCoverLetter, duplicateCoverLetter } from "../actions";
import { SubmitButton } from "@/components/Form";

export default async function CoverLetterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const cl = await db.coverLetter.findFirst({
    where: { id, userId: user.id },
    include: { job: true },
  });
  if (!cl) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-start gap-4">
        <div>
          <Link
            href="/dashboard/cover-letters"
            className="text-xs uppercase tracking-wider text-[#666] hover:text-[#1a1a1a]"
          >
            ← All cover letters
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-2">
            {cl.title ?? "Untitled cover letter"}
          </h1>
          <p className="text-sm text-[#666] mt-1">
            {cl.style}
            {cl.job ? ` • ${cl.job.title} @ ${cl.job.company}` : ""}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <form action={duplicateCoverLetter}>
            <input type="hidden" name="id" value={cl.id} />
            <SubmitButton variant="ghost">Duplicate</SubmitButton>
          </form>
          <form action={deleteCoverLetter}>
            <input type="hidden" name="id" value={cl.id} />
            <SubmitButton variant="ghost">Delete</SubmitButton>
          </form>
        </div>
      </div>

      <CoverLetterEditor id={cl.id} initialContent={cl.content} />
    </div>
  );
}
