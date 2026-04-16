"use client";

import { useState, useTransition } from "react";
import { updateCoverLetter } from "../actions";

export function CoverLetterEditor({
  id,
  initialContent,
}: {
  id: string;
  initialContent: string;
}) {
  const [content, setContent] = useState(initialContent);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [showPrintHelp, setShowPrintHelp] = useState(false);

  function save() {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("content", content);
    startTransition(async () => {
      await updateCoverLetter(fd);
      setSavedAt(new Date().toLocaleTimeString());
    });
  }

  const previewSrc = `/api/cover-letters/${id}/html`;

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs uppercase tracking-wider text-[#666]">
              Edit
            </span>
            {savedAt && (
              <span className="text-xs text-[#666]">Saved at {savedAt}</span>
            )}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={28}
            className="w-full border border-[#1a1a1a] p-4 text-sm font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={save}
              disabled={pending}
              className="bg-[#1a1a1a] text-white px-4 py-2 text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs uppercase tracking-wider text-[#666]">
              Preview
            </span>
            <div className="flex gap-2">
              <a
                href={previewSrc}
                download="cover-letter.html"
                className="text-xs uppercase tracking-wider text-[#666] hover:text-[#1a1a1a]"
              >
                Download
              </a>
              <button
                onClick={() => setShowPrintHelp(true)}
                className="text-xs uppercase tracking-wider text-[#666] hover:text-[#1a1a1a]"
              >
                Save as PDF
              </button>
            </div>
          </div>
          <div className="border border-[#1a1a1a]">
            <iframe
              key={savedAt ?? "init"}
              src={previewSrc}
              className="w-full bg-white"
              style={{ height: "1100px" }}
              title="Cover letter preview"
            />
          </div>
        </div>
      </div>

      {showPrintHelp && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPrintHelp(false)}
        >
          <div
            className="bg-white border border-[#1a1a1a] max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-sm uppercase tracking-wider mb-3">
              Save as PDF
            </h3>
            <ol className="text-sm text-[#444] space-y-2 list-decimal list-inside leading-relaxed">
              <li>
                Save your edits, then{" "}
                <a
                  href={previewSrc}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  open the cover letter
                </a>{" "}
                in a new tab.
              </li>
              <li>Press ⌘P / Ctrl+P.</li>
              <li>Destination: Save as PDF.</li>
              <li>Margins: None.</li>
              <li>Save.</li>
            </ol>
            <button
              onClick={() => setShowPrintHelp(false)}
              className="mt-4 w-full text-xs uppercase tracking-wider text-[#666] hover:text-[#1a1a1a]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
