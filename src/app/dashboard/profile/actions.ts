"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/user";
import { db } from "@/lib/db";
import type { SkillCategory } from "@prisma/client";

const stringList = (raw: FormDataEntryValue | null) =>
  String(raw ?? "")
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);

const trim = (raw: FormDataEntryValue | null) => {
  const v = String(raw ?? "").trim();
  return v.length ? v : null;
};

const date = (raw: FormDataEntryValue | null) => {
  const v = trim(raw);
  return v ? new Date(v) : null;
};

const num = (raw: FormDataEntryValue | null) => {
  const v = trim(raw);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export async function updatePersonal(formData: FormData) {
  const user = await requireUser();
  await db.user.update({
    where: { id: user.id },
    data: {
      name: trim(formData.get("name")),
      phone: trim(formData.get("phone")),
      location: trim(formData.get("location")),
      linkedin: trim(formData.get("linkedin")),
      portfolio: trim(formData.get("portfolio")),
    },
  });
  revalidatePath("/dashboard/profile");
}

export async function updatePreferences(formData: FormData) {
  const user = await requireUser();
  const data = {
    targetRoles: stringList(formData.get("targetRoles")),
    industries: stringList(formData.get("industries")),
    workStyle: trim(formData.get("workStyle")),
    salaryMin: num(formData.get("salaryMin")),
    salaryMax: num(formData.get("salaryMax")),
  };
  await db.preferences.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  });
  revalidatePath("/dashboard/profile");
}

export async function addExperience(formData: FormData) {
  const user = await requireUser();
  const start = date(formData.get("startDate"));
  if (!start) throw new Error("Start date required");
  const current = formData.get("current") === "on";
  await db.experience.create({
    data: {
      userId: user.id,
      company: String(formData.get("company") ?? "").trim(),
      title: String(formData.get("title") ?? "").trim(),
      location: trim(formData.get("location")),
      startDate: start,
      endDate: current ? null : date(formData.get("endDate")),
      current,
      responsibilities: stringList(formData.get("responsibilities")),
      achievements: stringList(formData.get("achievements")),
    },
  });
  revalidatePath("/dashboard/profile");
}

export async function removeExperience(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  await db.experience.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/dashboard/profile");
}

export async function updateExperience(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const start = date(formData.get("startDate"));
  if (!start) throw new Error("Start date required");
  const current = formData.get("current") === "on";
  await db.experience.updateMany({
    where: { id, userId: user.id },
    data: {
      company: String(formData.get("company") ?? "").trim(),
      title: String(formData.get("title") ?? "").trim(),
      location: trim(formData.get("location")),
      startDate: start,
      endDate: current ? null : date(formData.get("endDate")),
      current,
      responsibilities: stringList(formData.get("responsibilities")),
      achievements: stringList(formData.get("achievements")),
    },
  });
  revalidatePath("/dashboard/profile");
}

export async function addProject(formData: FormData) {
  const user = await requireUser();
  await db.project.create({
    data: {
      userId: user.id,
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      techStack: stringList(formData.get("techStack")),
      url: trim(formData.get("url")),
      outcomes: trim(formData.get("outcomes")),
    },
  });
  revalidatePath("/dashboard/profile");
}

export async function removeProject(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  await db.project.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/dashboard/profile");
}

export async function updateProject(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  await db.project.updateMany({
    where: { id, userId: user.id },
    data: {
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      techStack: stringList(formData.get("techStack")),
      url: trim(formData.get("url")),
      outcomes: trim(formData.get("outcomes")),
    },
  });
  revalidatePath("/dashboard/profile");
}

export async function addEducation(formData: FormData) {
  const user = await requireUser();
  await db.education.create({
    data: {
      userId: user.id,
      school: String(formData.get("school") ?? "").trim(),
      degree: trim(formData.get("degree")),
      field: trim(formData.get("field")),
      startDate: date(formData.get("startDate")),
      endDate: date(formData.get("endDate")),
      gpa: num(formData.get("gpa")),
    },
  });
  revalidatePath("/dashboard/profile");
}

export async function removeEducation(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  await db.education.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/dashboard/profile");
}

export async function updateEducation(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  await db.education.updateMany({
    where: { id, userId: user.id },
    data: {
      school: String(formData.get("school") ?? "").trim(),
      degree: trim(formData.get("degree")),
      field: trim(formData.get("field")),
      startDate: date(formData.get("startDate")),
      endDate: date(formData.get("endDate")),
      gpa: num(formData.get("gpa")),
    },
  });
  revalidatePath("/dashboard/profile");
}

const SKILL_CATS: SkillCategory[] = ["TECHNICAL", "SOFT", "TOOL", "LANGUAGE"];

export async function addSkill(formData: FormData) {
  const user = await requireUser();
  const cat = String(formData.get("category") ?? "TECHNICAL") as SkillCategory;
  if (!SKILL_CATS.includes(cat)) throw new Error("Invalid skill category");
  await db.skill.create({
    data: {
      userId: user.id,
      name: String(formData.get("name") ?? "").trim(),
      category: cat,
    },
  });
  revalidatePath("/dashboard/profile");
}

export async function removeSkill(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  await db.skill.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/dashboard/profile");
}

export async function addCertification(formData: FormData) {
  const user = await requireUser();
  await db.certification.create({
    data: {
      userId: user.id,
      name: String(formData.get("name") ?? "").trim(),
      issuer: trim(formData.get("issuer")),
      date: date(formData.get("date")),
    },
  });
  revalidatePath("/dashboard/profile");
}

export async function removeCertification(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  await db.certification.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/dashboard/profile");
}

export async function updateCertification(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  await db.certification.updateMany({
    where: { id, userId: user.id },
    data: {
      name: String(formData.get("name") ?? "").trim(),
      issuer: trim(formData.get("issuer")),
      date: date(formData.get("date")),
    },
  });
  revalidatePath("/dashboard/profile");
}
