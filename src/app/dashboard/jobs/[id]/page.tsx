import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/user";
import { db } from "@/lib/db";
import { deleteJob } from "../actions";
import { SubmitButton } from "@/components/Form";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const job = await db.job.findFirst({
    where: { id, userId: user.id },
    include: { resumes: true, coverLetters: true },
  });
  if (!job) notFound();

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex justify-between items-start gap-4">
        <div>
          <Link
            href="/dashboard/jobs"
            className="text-xs uppercase tracking-wider text-[#666] hover:text-[#1a1a1a]"
          >
            ← All jobs
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-2">{job.title}</h1>
          <div className="text-sm text-[#666] mt-1">
            {job.company}
            {job.location ? ` • ${job.location}` : ""}
            {job.salary ? ` • ${job.salary}` : ""}
          </div>
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs underline text-[#666] mt-1 inline-block"
            >
              Original posting →
            </a>
          )}
        </div>
        <form action={deleteJob}>
          <input type="hidden" name="id" value={job.id} />
          <SubmitButton variant="ghost">Delete</SubmitButton>
        </form>
      </div>

      <div className="flex gap-3">
        <Link
          href={`/dashboard/resumes/new?jobId=${job.id}`}
          className="bg-[#1a1a1a] text-white px-4 py-2 text-xs uppercase tracking-wider hover:opacity-90"
        >
          Tailor a resume
        </Link>
        <Link
          href={`/dashboard/cover-letters/new?jobId=${job.id}`}
          className="border border-[#1a1a1a] px-4 py-2 text-xs uppercase tracking-wider hover:bg-[#1a1a1a] hover:text-white"
        >
          Write a cover letter
        </Link>
      </div>

      <section>
        <h2 className="text-sm uppercase tracking-wider font-bold mb-3 border-b border-[#1a1a1a] pb-2">
          Description
        </h2>
        <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
          {job.description}
        </pre>
      </section>

      {job.requirements && (
        <section>
          <h2 className="text-sm uppercase tracking-wider font-bold mb-3 border-b border-[#1a1a1a] pb-2">
            Requirements
          </h2>
          <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
            {job.requirements}
          </pre>
        </section>
      )}

      {(job.resumes.length > 0 || job.coverLetters.length > 0) && (
        <section>
          <h2 className="text-sm uppercase tracking-wider font-bold mb-3 border-b border-[#1a1a1a] pb-2">
            Generated for this job
          </h2>
          <ul className="text-sm space-y-2">
            {job.resumes.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/dashboard/resumes/${r.id}`}
                  className="hover:underline"
                >
                  Resume — {r.createdAt.toLocaleDateString()}
                </Link>
              </li>
            ))}
            {job.coverLetters.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/dashboard/cover-letters/${c.id}`}
                  className="hover:underline"
                >
                  {c.style} cover letter — {c.createdAt.toLocaleDateString()}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
