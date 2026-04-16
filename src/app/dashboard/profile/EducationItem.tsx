"use client";

import { useState } from "react";
import type { Education } from "@prisma/client";
import { Field, SubmitButton } from "@/components/Form";
import { updateEducation, removeEducation } from "./actions";

function fmt(d: Date | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function isoDate(d: Date | null): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function EducationItem({ education: ed }: { education: Education }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <li className="border border-[#eee] p-4 flex justify-between gap-4">
        <div className="flex-1">
          <div className="font-bold text-sm">{ed.school}</div>
          <div className="text-xs text-[#666]">
            {[ed.degree, ed.field].filter(Boolean).join(", ")}
            {ed.endDate ? ` • ${fmt(ed.endDate)}` : ""}
            {ed.gpa ? ` • GPA ${ed.gpa}` : ""}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="px-4 py-2 text-xs uppercase tracking-wider text-[#666] hover:text-[#1a1a1a] hover:underline"
          >
            Edit
          </button>
          <form action={removeEducation}>
            <input type="hidden" name="id" value={ed.id} />
            <SubmitButton variant="ghost">Remove</SubmitButton>
          </form>
        </div>
      </li>
    );
  }

  return (
    <li className="border border-[#1a1a1a] p-4">
      <form
        action={async (fd) => {
          await updateEducation(fd);
          setEditing(false);
        }}
        className="grid sm:grid-cols-2 gap-4"
      >
        <input type="hidden" name="id" value={ed.id} />
        <Field label="School" name="school" defaultValue={ed.school} required />
        <Field label="Degree" name="degree" defaultValue={ed.degree} />
        <Field label="Field of study" name="field" defaultValue={ed.field} />
        <Field label="GPA (optional)" name="gpa" defaultValue={ed.gpa ?? ""} />
        <Field
          label="Start date"
          name="startDate"
          type="date"
          defaultValue={isoDate(ed.startDate)}
        />
        <Field
          label="End date"
          name="endDate"
          type="date"
          defaultValue={isoDate(ed.endDate)}
        />
        <div className="sm:col-span-2 flex gap-3">
          <SubmitButton>Save changes</SubmitButton>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="px-4 py-2 text-xs uppercase tracking-wider text-[#666] hover:text-[#1a1a1a]"
          >
            Cancel
          </button>
        </div>
      </form>
    </li>
  );
}
