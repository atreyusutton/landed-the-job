import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/user";
import { db } from "@/lib/db";
import { ResumeViewer } from "./ResumeViewer";
import { deleteResume, duplicateResume } from "../actions";
import { SubmitButton } from "@/components/Form";

export default async function ResumeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const resume = await db.resume.findFirst({
    where: { id, userId: user.id },
    include: { job: true },
  });
  if (!resume) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-start gap-4">
        <div>
          <Link
            href="/dashboard/resumes"
            className="text-xs uppercase tracking-wider text-[#666] hover:text-[#1a1a1a]"
          >
            ← All resumes
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-2">
            {resume.title ?? "Untitled resume"}
          </h1>
          {resume.job && (
            <p className="text-sm text-[#666] mt-1">
              Tailored for {resume.job.title} @ {resume.job.company}
            </p>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <form action={duplicateResume}>
            <input type="hidden" name="id" value={resume.id} />
            <SubmitButton variant="ghost">Duplicate</SubmitButton>
          </form>
          <form action={deleteResume}>
            <input type="hidden" name="id" value={resume.id} />
            <SubmitButton variant="ghost">Delete</SubmitButton>
          </form>
        </div>
      </div>

      <ResumeViewer
        resumeId={resume.id}
        downloadName={`${(resume.title ?? "resume").replace(/[^\w-]+/g, "_")}.html`}
      />
    </div>
  );
}
