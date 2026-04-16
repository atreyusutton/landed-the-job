"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addJobFromPaste } from "../actions";

export function PasteJobForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await addJobFromPaste(text);
      if (res.ok) {
        router.push(`/dashboard/jobs/${res.id}`);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="text-xs uppercase tracking-wider text-[#666]">
          Paste anything: the listing, a screenshot caption, an email, the
          recruiter&apos;s description. Claude will pull out the title, company,
          location, salary, and split description vs. requirements.
        </span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={20}
          required
          placeholder="Paste the entire job posting here…"
          className="mt-2 w-full border border-[#1a1a1a] p-4 text-sm font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
        />
      </label>

      {error && (
        <div className="border border-[#1a1a1a] bg-[#fafafa] p-3 text-xs">
          {error}
        </div>
      )}

      {loading && (
        <div className="border border-[#eee] p-3 text-xs text-[#666] animate-pulse">
          Parsing… usually 5–15 seconds.
        </div>
      )}

      <button
        type="submit"
        disabled={loading || text.trim().length < 30}
        className="bg-[#1a1a1a] text-white px-6 py-2 text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Parsing…" : "Parse and save"}
      </button>
    </form>
  );
}
