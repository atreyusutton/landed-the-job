import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/user";
import { db } from "@/lib/db";
import { extractProfileFromFile, type ExtractedProfile } from "@/lib/extractProfile";
import { rateLimit } from "@/lib/rateLimit";
import type { SkillCategory } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

export async function POST(req: Request) {
  const user = await requireUser();

  const rl = rateLimit(`import-profile:${user.id}`, {
    max: 5,
    windowMs: 60 * 60 * 1000, // 5 imports per hour
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Slow down. Try again in ${rl.retryAfter}s.` },
      { status: 429 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (8MB max)" }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  let extracted: ExtractedProfile;
  try {
    extracted = await extractProfileFromFile({
      filename: file.name,
      mimeType: file.type,
      bytes,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Extraction failed" },
      { status: 422 },
    );
  }

  const summary = await mergeIntoProfile(user.id, extracted);

  revalidatePath("/dashboard/profile");
  return NextResponse.json({ ok: true, summary });
}

async function mergeIntoProfile(userId: string, p: ExtractedProfile) {
  // Personal: only fill blanks (don't overwrite anything user has set).
  if (p.personal) {
    const current = await db.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        phone: true,
        location: true,
        linkedin: true,
        portfolio: true,
      },
    });
    if (current) {
      const updates: Record<string, string> = {};
      if (!current.name && p.personal.name) updates.name = p.personal.name;
      if (!current.phone && p.personal.phone) updates.phone = p.personal.phone;
      if (!current.location && p.personal.location) updates.location = p.personal.location;
      if (!current.linkedin && p.personal.linkedin) updates.linkedin = p.personal.linkedin;
      if (!current.portfolio && p.personal.portfolio) updates.portfolio = p.personal.portfolio;
      if (Object.keys(updates).length) {
        await db.user.update({ where: { id: userId }, data: updates });
      }
    }
  }

  const added = {
    experiences: 0,
    projects: 0,
    education: 0,
    skills: 0,
    certifications: 0,
  };

  // Experiences: append all.
  if (p.experiences?.length) {
    for (const e of p.experiences) {
      if (!e.company || !e.title) continue;
      const startDate = parseDate(e.startDate) ?? new Date();
      await db.experience.create({
        data: {
          userId,
          company: e.company,
          title: e.title,
          location: e.location ?? null,
          startDate,
          endDate: e.current ? null : parseDate(e.endDate),
          current: !!e.current,
          responsibilities: Array.isArray(e.responsibilities) ? e.responsibilities : [],
          achievements: Array.isArray(e.achievements) ? e.achievements : [],
        },
      });
      added.experiences++;
    }
  }

  if (p.projects?.length) {
    for (const pr of p.projects) {
      if (!pr.name) continue;
      await db.project.create({
        data: {
          userId,
          name: pr.name,
          description: pr.description ?? "",
          techStack: Array.isArray(pr.techStack) ? pr.techStack : [],
          url: pr.url ?? null,
          outcomes: pr.outcomes ?? null,
        },
      });
      added.projects++;
    }
  }

  if (p.education?.length) {
    for (const ed of p.education) {
      if (!ed.school) continue;
      await db.education.create({
        data: {
          userId,
          school: ed.school,
          degree: ed.degree ?? null,
          field: ed.field ?? null,
          startDate: parseDate(ed.startDate),
          endDate: parseDate(ed.endDate),
          gpa: typeof ed.gpa === "number" ? ed.gpa : null,
        },
      });
      added.education++;
    }
  }

  if (p.skills?.length) {
    // Dedupe against existing skills (case-insensitive name match).
    const existing = await db.skill.findMany({
      where: { userId },
      select: { name: true },
    });
    const existingSet = new Set(existing.map((s) => s.name.toLowerCase()));
    const validCats: SkillCategory[] = ["TECHNICAL", "SOFT", "TOOL", "LANGUAGE"];
    for (const s of p.skills) {
      if (!s.name || existingSet.has(s.name.toLowerCase())) continue;
      const cat = validCats.includes(s.category as SkillCategory)
        ? (s.category as SkillCategory)
        : "TECHNICAL";
      await db.skill.create({
        data: { userId, name: s.name, category: cat },
      });
      existingSet.add(s.name.toLowerCase());
      added.skills++;
    }
  }

  if (p.certifications?.length) {
    for (const c of p.certifications) {
      if (!c.name) continue;
      await db.certification.create({
        data: {
          userId,
          name: c.name,
          issuer: c.issuer ?? null,
          date: parseDate(c.date),
        },
      });
      added.certifications++;
    }
  }

  return added;
}

function parseDate(input?: string | null): Date | null {
  if (!input) return null;
  const s = input.trim();
  if (!s || /^(present|current|now)$/i.test(s)) return null;
  // Accept YYYY, YYYY-MM, YYYY-MM-DD, full ISO.
  const yearOnly = /^\d{4}$/.exec(s);
  if (yearOnly) return new Date(`${s}-01-01T00:00:00Z`);
  const yearMonth = /^\d{4}-\d{2}$/.exec(s);
  if (yearMonth) return new Date(`${s}-01T00:00:00Z`);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}
