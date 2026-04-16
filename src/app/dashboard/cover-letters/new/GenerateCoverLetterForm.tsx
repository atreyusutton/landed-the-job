"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateCoverLetter } from "../actions";
import { Paywall } from "@/components/Paywall";
import type { Job } from "@prisma/client";

const STYLES = [
  { value: "personal", label: "Personal" },
  { value: "formal", label: "Formal" },
  { value: "technical", label: "Technical" },
];

export function GenerateCoverLetterForm({
  jobs,
  initialJobId,
}: {
  jobs: Job[];
  initialJobId?: string;
}) {
  const router = useRouter();
  const [jobId, setJobId] = useState(initialJobId ?? jobs[0]?.id ?? "");
  const [companyUrl, setCompanyUrl] = useState("");
  const [style, setStyle] = useState("personal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await generateCoverLetter({ jobId, companyUrl, style });
      if (res.ok) {
        router.push(`/dashboard/cover-letters/${res.id}`);
      } else if (res.outOfCredits) {
        setPaywallOpen(true);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-[#666]">Job</span>
          <select
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            className="mt-1 w-full border border-[#1a1a1a] px-3 py-2 text-sm bg-white"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} — {j.company}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-wider text-[#666]">
            Company website (optional, used for tone)
          </span>
          <input
            type="url"
            value={companyUrl}
            onChange={(e) => setCompanyUrl(e.target.value)}
            placeholder="https://example.com"
            className="mt-1 w-full border border-[#1a1a1a] px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-wider text-[#666]">Style</span>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {STYLES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStyle(s.value)}
                className={`border px-3 py-2 text-xs uppercase tracking-wider ${
                  style === s.value
                    ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                    : "border-[#1a1a1a] hover:bg-[#fafafa]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </label>

        {error && (
          <div className="border border-[#1a1a1a] bg-[#fafafa] p-3 text-xs">
            {error}
          </div>
        )}

        {loading && (
          <div className="border border-[#eee] p-4 text-sm text-[#666] animate-pulse">
            Reading the company site and writing your letter…
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !jobId}
          className="bg-[#1a1a1a] text-white px-6 py-2 text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate cover letter"}
        </button>
      </form>
      {paywallOpen && <Paywall onClose={() => setPaywallOpen(false)} />}
    </>
  );
}
