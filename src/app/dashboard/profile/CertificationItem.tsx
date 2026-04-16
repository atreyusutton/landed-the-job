"use client";

import { useState } from "react";
import type { Certification } from "@prisma/client";
import { Field, SubmitButton } from "@/components/Form";
import { updateCertification, removeCertification } from "./actions";

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

export function CertificationItem({ cert: c }: { cert: Certification }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <li className="flex justify-between items-start gap-4 border border-[#eee] p-3">
        <div className="text-sm flex-1">
          <span className="font-bold">{c.name}</span>
          {c.issuer ? <span className="text-[#666]"> — {c.issuer}</span> : null}
          {c.date ? (
            <span className="text-[#666] text-xs"> • {fmt(c.date)}</span>
          ) : null}
        </div>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="px-4 py-2 text-xs uppercase tracking-wider text-[#666] hover:text-[#1a1a1a] hover:underline"
          >
            Edit
          </button>
          <form action={removeCertification}>
            <input type="hidden" name="id" value={c.id} />
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
          await updateCertification(fd);
          setEditing(false);
        }}
        className="grid sm:grid-cols-3 gap-4"
      >
        <input type="hidden" name="id" value={c.id} />
        <Field label="Name" name="name" defaultValue={c.name} required />
        <Field label="Issuer" name="issuer" defaultValue={c.issuer} />
        <Field
          label="Date"
          name="date"
          type="date"
          defaultValue={isoDate(c.date)}
        />
        <div className="sm:col-span-3 flex gap-3">
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
