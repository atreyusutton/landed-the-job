"use client";

import { useState } from "react";
import type { Experience } from "@prisma/client";
import { Field, TextArea, SubmitButton } from "@/components/Form";
import { updateExperience, removeExperience } from "./actions";

function fmt(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function isoDate(d: Date | null): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function ExperienceItem({ experience }: { experience: Experience }) {
  const [editing, setEditing] = useState(false);
  const e = experience;

  if (!editing) {
    return (
      <li className="border border-[#eee] p-4 flex justify-between gap-4">
        <div className="flex-1">
          <div className="font-bold text-sm">
            {e.title} — {e.company}
          </div>
          <div className="text-xs text-[#666]">
            {fmt(e.startDate)} – {e.current ? "Present" : fmt(e.endDate)}
            {e.location ? ` • ${e.location}` : ""}
          </div>
          {e.responsibilities.length > 0 && (
            <ul className="text-xs mt-2 list-disc list-inside text-[#444]">
              {e.responsibilities.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}
          {e.achievements.length > 0 && (
            <ul className="text-xs mt-2 list-disc list-inside text-[#444]">
              {e.achievements.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="px-4 py-2 text-xs uppercase tracking-wider text-[#666] hover:text-[#1a1a1a] hover:underline"
          >
            Edit
          </button>
          <form action={removeExperience}>
            <input type="hidden" name="id" value={e.id} />
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
          await updateExperience(fd);
          setEditing(false);
        }}
        className="grid sm:grid-cols-2 gap-4"
      >
        <input type="hidden" name="id" value={e.id} />
        <Field label="Company" name="company" defaultValue={e.company} required />
        <Field label="Title" name="title" defaultValue={e.title} required />
        <Field label="Location" name="location" defaultValue={e.location} />
        <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#666] mt-6">
          <input type="checkbox" name="current" defaultChecked={e.current} />{" "}
          Currently working here
        </label>
        <Field
          label="Start date"
          name="startDate"
          type="date"
          defaultValue={isoDate(e.startDate)}
          required
        />
        <Field
          label="End date"
          name="endDate"
          type="date"
          defaultValue={isoDate(e.endDate)}
        />
        <div className="sm:col-span-2">
          <TextArea
            label="Responsibilities (one per line)"
            name="responsibilities"
            defaultValue={e.responsibilities.join("\n")}
            rows={4}
          />
        </div>
        <div className="sm:col-span-2">
          <TextArea
            label="Achievements (one per line)"
            name="achievements"
            defaultValue={e.achievements.join("\n")}
            rows={3}
          />
        </div>
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
