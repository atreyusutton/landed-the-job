import Link from "next/link";
import { Show } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-[#1a1a1a]">
      <header className="border-b border-[#1a1a1a] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold tracking-[0.15em] uppercase text-lg">
          LandedTheJob
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Show when="signed-out">
            <Link href="/sign-in" className="hover:underline">Sign in</Link>
            <Link
              href="/sign-up"
              className="bg-[#1a1a1a] text-white px-4 py-2 hover:opacity-90"
            >
              Get started
            </Link>
          </Show>
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="bg-[#1a1a1a] text-white px-4 py-2 hover:opacity-90"
            >
              Dashboard
            </Link>
          </Show>
        </nav>
      </header>

      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          Your resume, rewritten to win.
        </h1>
        <p className="text-lg text-[#444] mb-10 leading-relaxed">
          Paste a job listing. Get a tailored resume and cover letter that
          mirrors the role&apos;s language and shows you&apos;re the right hire.
        </p>
        <Show when="signed-out">
          <Link
            href="/sign-up"
            className="inline-block bg-[#1a1a1a] text-white px-8 py-3 text-sm uppercase tracking-wider hover:opacity-90"
          >
            Start free — 3 generations
          </Link>
        </Show>
        <Show when="signed-in">
          <Link
            href="/dashboard"
            className="inline-block bg-[#1a1a1a] text-white px-8 py-3 text-sm uppercase tracking-wider hover:opacity-90"
          >
            Go to dashboard
          </Link>
        </Show>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-12">
        {[
          {
            title: "Tailored resumes",
            body: "Paste any job listing. Your experience and skills are rewritten to mirror the role's language.",
          },
          {
            title: "Cover letters that fit",
            body: "We read the company's site for tone and values. Choose Personal, Formal, or Technical.",
          },
          {
            title: "Job listing importer",
            body: "Drop a LinkedIn, Indeed, Lever, Greenhouse, or Workday URL. We parse it for you.",
          },
        ].map((f) => (
          <div key={f.title}>
            <h3 className="font-bold uppercase tracking-wider text-sm mb-2">
              {f.title}
            </h3>
            <p className="text-sm text-[#444] leading-relaxed">{f.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
