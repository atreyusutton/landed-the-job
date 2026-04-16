"use client";

import { useState } from "react";
import type { Project } from "@prisma/client";
import { Field, TextArea, SubmitButton } from "@/components/Form";
import { updateProject, removeProject } from "./actions";

export function ProjectItem({ project: p }: { project: Project }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <li className="border border-[#eee] p-4 flex justify-between gap-4">
        <div className="flex-1">
          <div className="font-bold text-sm">{p.name}</div>
          {p.description && (
            <div className="text-xs text-[#444] mt-1">{p.description}</div>
          )}
          {p.techStack.length > 0 && (
            <div className="text-xs text-[#666] mt-1">
              {p.techStack.join(" · ")}
            </div>
          )}
          {p.url && (
            <a
              href={p.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[#666] underline mt-1 inline-block"
            >
              {p.url}
            </a>
          )}
          {p.outcomes && (
            <div className="text-xs text-[#444] mt-1">
              <span className="text-[#666]">Outcomes:</span> {p.outcomes}
            </div>
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
          <form action={removeProject}>
            <input type="hidden" name="id" value={p.id} />
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
          await updateProject(fd);
          setEditing(false);
        }}
        className="grid sm:grid-cols-2 gap-4"
      >
        <input type="hidden" name="id" value={p.id} />
        <Field label="Name" name="name" defaultValue={p.name} required />
        <Field label="URL" name="url" defaultValue={p.url} />
        <div className="sm:col-span-2">
          <TextArea
            label="Description"
            name="description"
            defaultValue={p.description}
            rows={2}
          />
        </div>
        <Field
          label="Tech stack (comma-separated)"
          name="techStack"
          defaultValue={p.techStack.join(", ")}
        />
        <Field label="Outcomes" name="outcomes" defaultValue={p.outcomes} />
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
