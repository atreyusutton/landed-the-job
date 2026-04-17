"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/user";
import { db } from "@/lib/db";
import { consumeCredit, OutOfCreditsError, DailyCapExceededError } from "@/lib/credits";
import { generateResumeData } from "@/lib/generateResume";
import { renderResumeHtml } from "@/lib/resumeTemplate";
import { rateLimit } from "@/lib/rateLimit";

export type GenerateResumeResult =
  | { ok: true; id: string }
  | { ok: false; error: string; outOfCredits?: boolean; dailyCapExceeded?: boolean };

export async function generateResume(
  jobId: string,
): Promise<GenerateResumeResult> {
  const user = await requireUser();

  const rl = rateLimit(`gen-resume:${user.id}`, { max: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return {
      ok: false,
      error: `You're generating too quickly. Try again in ${rl.retryAfter}s.`,
    };
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
    if (err instanceof DailyCapExceededError) {
      return {
        ok: false,
        dailyCapExceeded: true,
        error: `You've hit today's cap of 20 generations. Resets at ${err.retryAt.toLocaleString()}.`,
      };
    }
    throw err;
  }

  let html: string;
  try {
    const data = await generateResumeData(profile, job);
    html = renderResumeHtml(data);
  } catch (err) {
    // Refund credit on AI failure.
    await db.user.update({
      where: { id: user.id },
      data: { credits: { increment: 1 } },
    });
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Generation failed",
    };
  }

  const resume = await db.resume.create({
    data: {
      userId: user.id,
      jobId: job.id,
      title: `${job.title} — ${job.company}`,
      html,
    },
  });

  revalidatePath("/dashboard/resumes");
  revalidatePath("/dashboard");
  return { ok: true, id: resume.id };
}

export async function deleteResume(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  await db.resume.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/dashboard/resumes");
  redirect("/dashboard/resumes");
}

export async function duplicateResume(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const original = await db.resume.findFirst({
    where: { id, userId: user.id },
  });
  if (!original) throw new Error("Resume not found");
  const copy = await db.resume.create({
    data: {
      userId: user.id,
      jobId: original.jobId,
      title: original.title ? `${original.title} (copy)` : null,
      html: original.html,
    },
  });
  revalidatePath("/dashboard/resumes");
  redirect(`/dashboard/resumes/${copy.id}`);
}
