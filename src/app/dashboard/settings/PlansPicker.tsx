"use client";

import { useState } from "react";

export function PlansPicker({
  plans,
  showPortal,
}: {
  plans: { key: string; name: string; description: string }[];
  showPortal: boolean;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkout(plan: string) {
    setError(null);
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not start checkout.");
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setLoading(null);
    }
  }

  async function portal() {
    setError(null);
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not open portal.");
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        {plans.map((p) => (
          <div key={p.key} className="border border-[#1a1a1a] p-5">
            <div className="font-bold text-lg">{p.name}</div>
            <div className="text-xs text-[#666] mt-1 mb-4">{p.description}</div>
            <button
              onClick={() => checkout(p.key)}
              disabled={loading !== null}
              className="w-full bg-[#1a1a1a] text-white py-2 text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
            >
              {loading === p.key ? "Redirecting…" : "Choose"}
            </button>
          </div>
        ))}
      </div>

      {showPortal && (
        <button
          onClick={portal}
          disabled={loading !== null}
          className="text-xs uppercase tracking-wider text-[#666] hover:text-[#1a1a1a] disabled:opacity-50"
        >
          {loading === "portal" ? "Opening…" : "Manage subscription →"}
        </button>
      )}

      {error && (
        <div className="border border-[#1a1a1a] bg-[#fafafa] p-3 text-xs">
          {error}
        </div>
      )}
    </div>
  );
}
