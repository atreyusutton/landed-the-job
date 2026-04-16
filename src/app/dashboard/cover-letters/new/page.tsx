import Link from "next/link";
import { requireUser } from "@/lib/user";
import { db } from "@/lib/db";
import { GenerateCoverLetterForm } from "./GenerateCoverLetterForm";

export default async function NewCoverLetterPage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string }>;
}) {
  const { jobId } = await searchParams;
  const user = await requireUser();
  const jobs = await db.job.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  if (jobs.length === 0) {
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Write a cover letter</h1>
        <p className="text-sm text-[#666]">
          You need at least one saved job to generate a cover letter.
        </p>
        <Link
          href="/dashboard/jobs/new"
          className="inline-block bg-[#1a1a1a] text-white px-4 py-2 text-xs uppercase tracking-wider hover:opacity-90"
        >
          Import a job
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Write a cover letter</h1>
        <p className="text-sm text-[#666] mt-1">
          {user.plan === "unlimited"
            ? "Unlimited generations on your plan."
            : `${user.credits} credit${user.credits === 1 ? "" : "s"} remaining.`}
        </p>
      </div>
      <GenerateCoverLetterForm jobs={jobs} initialJobId={jobId} />
    </div>
  );
}
