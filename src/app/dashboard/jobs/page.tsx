import Link from "next/link";
import { requireUser } from "@/lib/user";
import { db } from "@/lib/db";

export default async function JobsPage() {
  const user = await requireUser();
  const jobs = await db.job.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Saved jobs</h1>
          <p className="text-[#666] text-sm mt-1">
            Import job listings to tailor resumes and cover letters.
          </p>
        </div>
        <Link
          href="/dashboard/jobs/new"
          className="bg-[#1a1a1a] text-white px-4 py-2 text-xs uppercase tracking-wider hover:opacity-90"
        >
          Import job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="border border-[#1a1a1a] p-10 text-center">
          <p className="text-sm text-[#666] mb-4">No jobs saved yet.</p>
          <Link
            href="/dashboard/jobs/new"
            className="inline-block bg-[#1a1a1a] text-white px-6 py-2 text-xs uppercase tracking-wider hover:opacity-90"
          >
            Import your first job
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-[#eee] border-y border-[#eee]">
          {jobs.map((j) => (
            <li key={j.id}>
              <Link
                href={`/dashboard/jobs/${j.id}`}
                className="flex justify-between items-center py-4 px-2 hover:bg-[#fafafa]"
              >
                <div>
                  <div className="font-bold text-sm">{j.title}</div>
                  <div className="text-xs text-[#666]">
                    {j.company}
                    {j.location ? ` • ${j.location}` : ""}
                    {j.source ? ` • ${j.source}` : ""}
                  </div>
                </div>
                <div className="text-xs text-[#666]">
                  {j.createdAt.toLocaleDateString()}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
