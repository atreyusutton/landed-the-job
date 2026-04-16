import Link from "next/link";
import { requireUser } from "@/lib/user";
import { db } from "@/lib/db";
import { deleteResume } from "./actions";
import { SubmitButton } from "@/components/Form";

export default async function ResumesPage() {
  const user = await requireUser();
  const resumes = await db.resume.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { job: true },
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resumes</h1>
          <p className="text-[#666] text-sm mt-1">
            Tailored resumes you&apos;ve generated.
          </p>
        </div>
        <Link
          href="/dashboard/resumes/new"
          className="bg-[#1a1a1a] text-white px-4 py-2 text-xs uppercase tracking-wider hover:opacity-90"
        >
          New resume
        </Link>
      </div>

      {resumes.length === 0 ? (
        <div className="border border-[#1a1a1a] p-10 text-center">
          <p className="text-sm text-[#666] mb-4">No resumes yet.</p>
          <Link
            href="/dashboard/resumes/new"
            className="inline-block bg-[#1a1a1a] text-white px-6 py-2 text-xs uppercase tracking-wider hover:opacity-90"
          >
            Tailor your first resume
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-[#eee] border-y border-[#eee]">
          {resumes.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-4 py-4 px-2 hover:bg-[#fafafa]"
            >
              <Link
                href={`/dashboard/resumes/${r.id}`}
                className="flex-1 min-w-0"
              >
                <div className="font-bold text-sm truncate">
                  {r.title ?? "Untitled resume"}
                </div>
                {r.job && (
                  <div className="text-xs text-[#666] truncate">
                    {r.job.title} @ {r.job.company}
                  </div>
                )}
              </Link>
              <div className="text-xs text-[#666] shrink-0">
                {r.createdAt.toLocaleDateString()}
              </div>
              <form action={deleteResume} className="shrink-0">
                <input type="hidden" name="id" value={r.id} />
                <SubmitButton variant="ghost">Delete</SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
