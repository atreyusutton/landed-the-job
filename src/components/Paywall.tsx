"use client";

import Link from "next/link";

export function Paywall({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#1a1a1a] max-w-md w-full p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          You&apos;re out of credits.
        </h2>
        <p className="text-sm text-[#666] mb-6">
          Pick a plan to keep generating tailored resumes and cover letters.
        </p>
        <Link
          href="/dashboard/settings"
          className="block w-full bg-[#1a1a1a] text-white text-center py-3 text-xs uppercase tracking-wider hover:opacity-90"
        >
          See plans
        </Link>
        <button
          onClick={onClose}
          className="block w-full mt-3 text-xs uppercase tracking-wider text-[#666] hover:text-[#1a1a1a]"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
