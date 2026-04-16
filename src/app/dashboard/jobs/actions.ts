"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/user";
import { db } from "@/lib/db";
import { parseJobText } from "@/lib/parseJobText";
import { rateLimit } from "@/lib/rateLimit";

export type AddJobFromPasteResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function addJobFromPaste(
  text: string,
): Promise<AddJobFromPasteResult> {
  const user = await requireUser();
  const rl = rateLimit(`paste-job:${user.id}`, { max: 20, windowMs: 60_000 });
  if (!rl.ok) {
    return {
      ok: false,
      error: `Slow down. Try again in ${rl.retryAfter}s.`,
    };
  }

  try {
    const parsed = await parseJobText(text);
    const job = await db.job.create({
      data: {
        userId: user.id,
        title: parsed.title,
        company: parsed.company,
        description: parsed.description,
        requirements: parsed.requirements ?? null,
        location: parsed.location ?? null,
        salary: parsed.salary ?? null,
        source: "paste",
      },
    });
    revalidatePath("/dashboard/jobs");
    return { ok: true, id: job.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Parse failed",
    };
  }
}

export async function deleteJob(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  await db.job.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/dashboard/jobs");
  redirect("/dashboard/jobs");
}
