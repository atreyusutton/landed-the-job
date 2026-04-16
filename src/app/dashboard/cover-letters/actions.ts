"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/user";
import { db } from "@/lib/db";
import { consumeCredit, OutOfCreditsError } from "@/lib/credits";
import {
  generateCoverLetterContent,
  type CoverLetterStyle,
} from "@/lib/generateCoverLetter";
import { rateLimit } from "@/lib/rateLimit";

const STYLES: CoverLetterStyle[] = ["personal", "formal", "technical"];

export type GenerateCoverLetterResult =
  | { ok: true; id: string }
  | { ok: false; error: string; outOfCredits?: boolean };

export async function generateCoverLetter({
  jobId,
  companyUrl,
  style,
}: {
  jobId: string;
  companyUrl: string;
  style: string;
}): Promise<GenerateCoverLetterResult> {
  const user = await requireUser();

  const rl = rateLimit(`gen-cl:${user.id}`, { max: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return {
      ok: false,
      error: `You're generating too quickly. Try again in ${rl.retryAfter}s.`,
    };
  }

  if (!STYLES.includes(style as CoverLetterStyle)) {
    return { ok: false, error: "Invalid style" };
  }

  const profile = await db.user.findUnique({
    where: { id: user.id },
    include: {
      experiences: { orderBy: { startDate: "desc" } },
      projects: true,
      education: { orderBy: { endDate: "desc" } },
      skills: true,
      certs: { orderBy: { date: "desc" } },
    },
  });
  if (!profile) return { ok: false, error: "Profile not found" };

  const job = await db.job.findFirst({
    where: { id: jobId, userId: user.id },
  });
  if (!job) return { ok: false, error: "Job not found" };

  try {
    await consumeCredit(user.id);
  } catch (err) {
    if (err instanceof OutOfCreditsError) {
      return { ok: false, outOfCredits: true, error: "Out of credits" };
    }
    throw err;
  }

  let content: string;
  try {
    content = await generateCoverLetterContent({
      profile,
      jobTitle: job.title,
      company: job.company,
      jobDescription: [job.description, job.requirements].filter(Boolean).join("\n\n"),
      companyUrl: companyUrl?.trim() || undefined,
      style: style as CoverLetterStyle,
    });
  } catch (err) {
    await db.user.update({
      where: { id: user.id },
      data: { credits: { increment: 1 } },
    });
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Generation failed",
    };
  }

  const cl = await db.coverLetter.create({
    data: {
      userId: user.id,
      jobId: job.id,
      title: `${job.title} — ${job.company}`,
      content,
      style,
    },
  });

  revalidatePath("/dashboard/cover-letters");
  revalidatePath("/dashboard");
  return { ok: true, id: cl.id };
}

export async function updateCoverLetter(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const content = String(formData.get("content") ?? "");
  await db.coverLetter.updateMany({
    where: { id, userId: user.id },
    data: { content },
  });
  revalidatePath(`/dashboard/cover-letters/${id}`);
}

export async function deleteCoverLetter(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  await db.coverLetter.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/dashboard/cover-letters");
  redirect("/dashboard/cover-letters");
}

export async function duplicateCoverLetter(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const orig = await db.coverLetter.findFirst({
    where: { id, userId: user.id },
  });
  if (!orig) throw new Error("Cover letter not found");
  const copy = await db.coverLetter.create({
    data: {
      userId: user.id,
      jobId: orig.jobId,
      title: orig.title ? `${orig.title} (copy)` : null,
      content: orig.content,
      style: orig.style,
    },
  });
  redirect(`/dashboard/cover-letters/${copy.id}`);
}
