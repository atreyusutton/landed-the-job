import Link from "next/link";
import { requireUser } from "@/lib/user";
import { db } from "@/lib/db";

export default async function CoverLettersPage() {
  const user = await requireUser();
  const letters = await db.coverLetter.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { job: true },
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cover letters</h1>
          <p className="text-[#666] text-sm mt-1">
            Tailored cover letters you&apos;ve generated.
          </p>
        </div>
        <Link
          href="/dashboard/cover-letters/new"
          className="bg-[#1a1a1a] text-white px-4 py-2 text-xs uppercase tracking-wider hover:opacity-90"
        >
          New cover letter
        </Link>
      </div>

      {letters.length === 0 ? (
        <div className="border border-[#1a1a1a] p-10 text-center">
          <p className="text-sm text-[#666] mb-4">No cover letters yet.</p>
          <Link
            href="/dashboard/cover-letters/new"
            className="inline-block bg-[#1a1a1a] text-white px-6 py-2 text-xs uppercase tracking-wider hover:opacity-90"
          >
            Write your first cover letter
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-[#eee] border-y border-[#eee]">
          {letters.map((c) => (
            <li key={c.id}>
              <Link
                href={`/dashboard/cover-letters/${c.id}`}
                className="flex justify-between items-center py-4 px-2 hover:bg-[#fafafa]"
              >
                <div>
                  <div className="font-bold text-sm">
                    {c.title ?? "Untitled cover letter"}
                  </div>
                  <div className="text-xs text-[#666]">
                    {c.style}
                    {c.job ? ` • ${c.job.title} @ ${c.job.company}` : ""}
                  </div>
                </div>
                <div className="text-xs text-[#666]">
                  {c.createdAt.toLocaleDateString()}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
