"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/user";
import { db } from "@/lib/db";

export async function addJobManual(formData: FormData) {
  const user = await requireUser();
  const job = await db.job.create({
    data: {
      userId: user.id,
      title: String(formData.get("title") ?? "").trim(),
      company: String(formData.get("company") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      requirements: (String(formData.get("requirements") ?? "").trim() || null) as string | null,
      location: (String(formData.get("location") ?? "").trim() || null) as string | null,
      salary: (String(formData.get("salary") ?? "").trim() || null) as string | null,
      url: (String(formData.get("url") ?? "").trim() || null) as string | null,
      source: "manual",
    },
  });
  revalidatePath("/dashboard/jobs");
  redirect(`/dashboard/jobs/${job.id}`);
}

export async function deleteJob(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  await db.job.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/dashboard/jobs");
  redirect("/dashboard/jobs");
}
