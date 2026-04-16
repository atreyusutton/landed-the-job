"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const ACCEPT = ".pdf,.docx,.txt,.md,.rtf,.html,.png,.jpg,.jpeg,.webp";

type Summary = {
  experiences: number;
  projects: number;
  education: number;
  skills: number;
  certifications: number;
};

export function ResumeUploader() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Summary | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setSuccess(null);
    setFilename(file.name);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/profile/import", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Import failed.");
        return;
      }
      setSuccess(data.summary as Summary);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setLoading(false);
    }
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  return (
    <div className="border border-[#1a1a1a] p-5 bg-[#fafafa]">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h2 className="text-sm uppercase tracking-wider font-bold">
            Already have a resume? Import it.
          </h2>
          <p className="text-xs text-[#666] mt-1">
            PDF, DOCX, image, or text. Claude reads it and fills in your
            profile. We add to what you have — nothing gets overwritten.
          </p>
        </div>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept={ACCEPT}
        onChange={onChange}
        className="hidden"
      />

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="border border-dashed border-[#1a1a1a] py-8 px-4 text-center bg-white"
      >
        <p className="text-sm text-[#666] mb-3">
          Drop a file here, or
        </p>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={loading}
          className="bg-[#1a1a1a] text-white px-5 py-2 text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Importing…" : "Choose file"}
        </button>
        {filename && !success && !error && (
          <p className="text-xs text-[#666] mt-3">{filename}</p>
        )}
      </div>

      {loading && (
        <p className="mt-3 text-xs text-[#666] animate-pulse">
          Reading {filename}… this can take 10–30 seconds.
        </p>
      )}

      {error && (
        <div className="mt-3 border border-[#1a1a1a] bg-white p-3 text-xs">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-3 border border-[#1a1a1a] bg-white p-3 text-xs">
          Imported from <strong>{filename}</strong>:{" "}
          {summaryLine(success)}
        </div>
      )}
    </div>
  );
}

function summaryLine(s: Summary): string {
  const parts: string[] = [];
  if (s.experiences) parts.push(`${s.experiences} experience${plural(s.experiences)}`);
  if (s.projects) parts.push(`${s.projects} project${plural(s.projects)}`);
  if (s.education) parts.push(`${s.education} education entr${s.education === 1 ? "y" : "ies"}`);
  if (s.skills) parts.push(`${s.skills} skill${plural(s.skills)}`);
  if (s.certifications) parts.push(`${s.certifications} certification${plural(s.certifications)}`);
  return parts.length ? parts.join(", ") + "." : "no new entries (everything was already on file).";
}

function plural(n: number): string {
  return n === 1 ? "" : "s";
}
