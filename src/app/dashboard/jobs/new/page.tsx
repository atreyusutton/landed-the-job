import { ImportJobForm } from "./ImportJobForm";
import { PasteJobForm } from "./PasteJobForm";

export default function NewJobPage() {
  return (
    <div className="space-y-12 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import a job</h1>
        <p className="text-[#666] text-sm mt-1">
          Two ways to add a job. The paste box is more reliable — URL parsing
          breaks on a lot of sites that block bots or render the listing in
          JavaScript.
        </p>
      </div>

      <section>
        <h2 className="text-sm uppercase tracking-wider font-bold mb-4 border-b border-[#1a1a1a] pb-2">
          Paste the listing (recommended)
        </h2>
        <PasteJobForm />
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-wider font-bold mb-4 border-b border-[#1a1a1a] pb-2">
          Or paste a URL
        </h2>
        <p className="text-xs text-[#666] mb-4">
          Works best with Lever, Greenhouse, Workday, and most ATS pages.
          LinkedIn / Indeed often gate behind login or render dynamically and
          will fall back to whatever the page&apos;s metadata exposes.
        </p>
        <ImportJobForm />
      </section>
    </div>
  );
}
