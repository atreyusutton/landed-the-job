"use client";

import { useState } from "react";

export function ResumeViewer({
  resumeId,
  downloadName,
}: {
  resumeId: string;
  downloadName: string;
}) {
  const [showPrintHelp, setShowPrintHelp] = useState(false);
  const src = `/api/resumes/${resumeId}/html`;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <a
          href={src}
          download={downloadName}
          className="bg-[#1a1a1a] text-white px-4 py-2 text-xs uppercase tracking-wider hover:opacity-90"
        >
          Download HTML
        </a>
        <button
          onClick={() => setShowPrintHelp(true)}
          className="border border-[#1a1a1a] px-4 py-2 text-xs uppercase tracking-wider hover:bg-[#1a1a1a] hover:text-white"
        >
          Save as PDF
        </button>
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="border border-[#1a1a1a] px-4 py-2 text-xs uppercase tracking-wider hover:bg-[#1a1a1a] hover:text-white"
        >
          Open in new tab
        </a>
      </div>

      <div className="border border-[#1a1a1a]">
        <iframe
          src={src}
          className="w-full bg-white"
          style={{ height: "1100px" }}
          title="Resume preview"
        />
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
                <a
                  href={src}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Open the resume
                </a>{" "}
                in a new tab.
              </li>
              <li>
                Press <kbd className="border px-1.5 py-0.5 text-xs">⌘P</kbd> /{" "}
                <kbd className="border px-1.5 py-0.5 text-xs">Ctrl+P</kbd>.
              </li>
              <li>
                Set destination to <strong>Save as PDF</strong>.
              </li>
              <li>
                Set margins to <strong>None</strong>.
              </li>
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
