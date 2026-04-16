import Link from "next/link";
import { requireUser } from "@/lib/user";
import { db } from "@/lib/db";

export default async function DashboardPage() {
  const user = await requireUser();
  const [resumes, coverLetters, jobs] = await Promise.all([
    db.resume.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { job: true },
    }),
    db.coverLetter.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { job: true },
    }),
    db.job.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}.
        </h1>
        <p className="text-[#666] mt-1 text-sm">
          {user.plan === "unlimited"
            ? "Unlimited generations on your plan."
            : `${user.credits} credit${user.credits === 1 ? "" : "s"} remaining.`}
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <QuickAction href="/dashboard/jobs/new" label="Import a job" />
        <QuickAction href="/dashboard/resumes/new" label="Tailor a resume" />
        <QuickAction
          href="/dashboard/cover-letters/new"
          label="Write a cover letter"
        />
      </div>

      <Section title="Recent resumes" empty="No resumes yet.">
        {resumes.map((r) => (
          <Row
            key={r.id}
            href={`/dashboard/resumes/${r.id}`}
            primary={r.title || (r.job ? `${r.job.title} @ ${r.job.company}` : "Untitled resume")}
            secondary={r.createdAt.toLocaleDateString()}
          />
        ))}
      </Section>

      <Section title="Recent cover letters" empty="No cover letters yet.">
        {coverLetters.map((c) => (
          <Row
            key={c.id}
            href={`/dashboard/cover-letters/${c.id}`}
            primary={c.title || (c.job ? `${c.job.title} @ ${c.job.company}` : "Untitled cover letter")}
            secondary={`${c.style} • ${c.createdAt.toLocaleDateString()}`}
          />
        ))}
      </Section>

      <Section title="Saved jobs" empty="No jobs saved yet.">
        {jobs.map((j) => (
          <Row
            key={j.id}
            href={`/dashboard/jobs/${j.id}`}
            primary={`${j.title} — ${j.company}`}
            secondary={j.location || ""}
          />
        ))}
      </Section>
    </div>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block border border-[#1a1a1a] px-4 py-6 text-center text-sm uppercase tracking-wider hover:bg-[#1a1a1a] hover:text-white"
    >
      {label}
    </Link>
  );
}

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <section>
      <h2 className="text-sm uppercase tracking-wider font-bold mb-3 border-b border-[#1a1a1a] pb-2">
        {title}
      </h2>
      {hasChildren ? (
        <ul className="divide-y divide-[#eee]">{children}</ul>
      ) : (
        <p className="text-sm text-[#666]">{empty}</p>
      )}
    </section>
  );
}

function Row({
  href,
  primary,
  secondary,
}: {
  href: string;
  primary: string;
  secondary: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex justify-between items-center py-3 hover:bg-[#fafafa] px-2 -mx-2"
      >
        <span className="text-sm">{primary}</span>
        <span className="text-xs text-[#666]">{secondary}</span>
      </Link>
    </li>
  );
}
