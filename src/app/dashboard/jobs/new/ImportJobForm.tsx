"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ImportJobForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/jobs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to import.");
        return;
      }
      router.push(`/dashboard/jobs/${data.id}`);
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
          Job URL
        </span>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          placeholder="https://www.linkedin.com/jobs/view/…"
          className="mt-1 w-full border border-[#1a1a1a] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
        />
      </label>

      {error && (
        <div className="border border-[#1a1a1a] bg-[#fafafa] p-3 text-xs">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-[#1a1a1a] text-white px-4 py-2 text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Importing…" : "Import"}
      </button>
    </form>
  );
}
