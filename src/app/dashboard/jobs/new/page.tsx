import { Field, TextArea, SubmitButton } from "@/components/Form";
import { addJobManual } from "../actions";
import { ImportJobForm } from "./ImportJobForm";

export default function NewJobPage() {
  return (
    <div className="space-y-12 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import a job</h1>
        <p className="text-[#666] text-sm mt-1">
          Paste a job URL and we&apos;ll parse it. Supports LinkedIn, Indeed,
          Lever, Greenhouse, Workday, and most ATS sites.
        </p>
      </div>

      <section>
        <h2 className="text-sm uppercase tracking-wider font-bold mb-4 border-b border-[#1a1a1a] pb-2">
          From URL
        </h2>
        <ImportJobForm />
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-wider font-bold mb-4 border-b border-[#1a1a1a] pb-2">
          Paste manually
        </h2>
        <p className="text-xs text-[#666] mb-4">
          Use this if URL parsing failed or the listing is gated behind a login.
        </p>
        <form action={addJobManual} className="grid sm:grid-cols-2 gap-4">
          <Field label="Job title" name="title" required />
          <Field label="Company" name="company" required />
          <Field label="Location" name="location" />
          <Field label="Salary" name="salary" />
          <div className="sm:col-span-2">
            <Field label="Original URL (optional)" name="url" />
          </div>
          <div className="sm:col-span-2">
            <TextArea
              label="Description"
              name="description"
              rows={8}
              placeholder="Paste the full job description here…"
            />
          </div>
          <div className="sm:col-span-2">
            <TextArea label="Requirements" name="requirements" rows={4} />
          </div>
          <div className="sm:col-span-2">
            <SubmitButton>Save job</SubmitButton>
          </div>
        </form>
      </section>
    </div>
  );
}
