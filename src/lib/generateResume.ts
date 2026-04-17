import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import type { ResumeData } from "@/lib/resumeTemplate";
import type {
  User,
  Experience,
  Project,
  Education,
  Skill,
  Certification,
  Job,
} from "@prisma/client";

export type FullProfile = User & {
  experiences: Experience[];
  projects: Project[];
  education: Education[];
  skills: Skill[];
  certs: Certification[];
};

const SYSTEM = `You are an expert technical resume writer optimizing for BOTH the human recruiter AND the Applicant Tracking System (ATS) that screens resumes before a human ever sees them. You rewrite a candidate's experience to mirror the language, keywords, and priorities of a specific job description — without inventing facts.

Truthfulness rules (non-negotiable):
- Never fabricate experience, employers, dates, tools, or credentials.
- Reuse the candidate's real role titles, companies, and dates exactly.
- If the JD requires a skill the candidate does NOT have in their profile, do not claim it. Omit rather than invent.

ATS keyword fidelity:
- Identify the JD's hard skills, tools, certifications, methodologies, and domain terms. Weave them verbatim into bullets where the candidate actually has matching experience.
- Use the JD's EXACT noun phrases when possible. If the JD says "Kubernetes", write "Kubernetes", not "k8s" (and vice versa — match whichever form the JD uses). When both forms appear in the JD, use both at least once across the resume.
- Mirror the JD's preferred phrasing for common tools (e.g., "Google Cloud Platform" vs "GCP", "JavaScript" vs "JS", "Continuous Integration" vs "CI").
- Spell out acronyms on first use if the JD does, otherwise match the JD's style.

Seniority-verb mirroring:
- Detect the JD's seniority tier from its verbs. Senior/lead roles use: led, owned, architected, drove, established, spearheaded, mentored, defined. Mid-level roles use: built, designed, implemented, shipped, delivered, developed. Junior/support roles use: contributed to, supported, assisted, collaborated on, helped.
- Match your bullet verbs to the JD's tier — but ONLY when the candidate's actual experience supports that level. Never over-level: if the source material says "helped build", do not write "led the architecture of". When in doubt, stay one tier below the JD rather than inflate.

Writing craft:
- Use strong action verbs and concrete numbers when the source material supports them.
- Lead every bullet with a verb. No passive voice.
- Keep bullets terse — ideally one line, max two. No trailing periods unless a sentence demands one.
- Avoid fluff words (utilized, leveraged, synergized). Prefer: used, built, shipped.

Output:
- STRICT JSON matching the provided schema. No prose, no markdown, no code fences.`;

const SCHEMA_DOC = `{
  "name": string,
  "contact": string[],   // city/state, phone, email, urls — no labels, just values
  "sections": [
    {
      "title": string,   // e.g. "Software Engineering Experience"
      "entries": [
        {
          "title": string,           // "Company — Role" or project name
          "meta": string | null,     // dates or short context (e.g. "2022–Present" or "Personal Project")
          "subtitle": string | null, // optional tagline under the title
          "bullets": string[]        // 3-6 short bullets
        }
      ]
    }
  ],
  "skills": [ { "label": string, "items": string } ],   // pipe- or comma-separated items per category
  "education": [ { "degree": string, "school": string } ]
}`;

function buildProfileBlock(p: FullProfile): string {
  const exp = p.experiences
    .map(
      (e) =>
        `- ${e.title} @ ${e.company} (${fmt(e.startDate)}–${e.current ? "Present" : fmt(e.endDate)})${e.location ? `, ${e.location}` : ""}\n  Responsibilities: ${e.responsibilities.join(" | ")}\n  Achievements: ${e.achievements.join(" | ")}`,
    )
    .join("\n");
  const proj = p.projects
    .map(
      (pr) =>
        `- ${pr.name}: ${pr.description}${pr.techStack.length ? ` [Tech: ${pr.techStack.join(", ")}]` : ""}${pr.outcomes ? ` — Outcomes: ${pr.outcomes}` : ""}`,
    )
    .join("\n");
  const edu = p.education
    .map(
      (e) =>
        `- ${e.school}${e.degree ? ` — ${e.degree}` : ""}${e.field ? ` in ${e.field}` : ""}${e.gpa ? ` (GPA ${e.gpa})` : ""}${e.endDate ? ` [grad ${fmt(e.endDate)}]` : ""}`,
    )
    .join("\n");
  const skills = p.skills
    .map((s) => `- [${s.category}] ${s.name}`)
    .join("\n");
  const certs = p.certs
    .map(
      (c) =>
        `- ${c.name}${c.issuer ? ` — ${c.issuer}` : ""}${c.date ? ` (${fmt(c.date)})` : ""}`,
    )
    .join("\n");

  return `Name: ${p.name ?? ""}
Email: ${p.email}
Phone: ${p.phone ?? ""}
Location: ${p.location ?? ""}
LinkedIn: ${p.linkedin ?? ""}
Portfolio: ${p.portfolio ?? ""}

EXPERIENCES:
${exp || "(none)"}

PROJECTS:
${proj || "(none)"}

EDUCATION:
${edu || "(none)"}

SKILLS:
${skills || "(none)"}

CERTIFICATIONS:
${certs || "(none)"}`;
}

function fmt(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export async function generateResumeData(
  profile: FullProfile,
  job: Job,
): Promise<ResumeData> {
  const userPrompt = `JOB DESCRIPTION:
Title: ${job.title}
Company: ${job.company}
${job.location ? `Location: ${job.location}\n` : ""}${job.description}
${job.requirements ? `\nRequirements:\n${job.requirements}` : ""}

CANDIDATE PROFILE:
${buildProfileBlock(profile)}

TASK: Produce a tailored resume as a JSON object matching this schema (and ONLY this schema):
${SCHEMA_DOC}

Group experiences and projects into 2–4 logical sections that highlight what this job cares about. Pick section titles that map to the job's domain — but use standard, ATS-parseable category words like "Experience", "Projects", "Software Engineering Experience", "Leadership", "Education" rather than cute or abstract headers. Reword bullets to surface the JD's exact keywords where the candidate's real experience supports them, and match the JD's seniority tier in your verb choices. Output JSON only.`;

  const res = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    system: SYSTEM,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = res.content
    .map((c) => (c.type === "text" ? c.text : ""))
    .join("");

  return parseJson(text);
}

function parseJson(text: string): ResumeData {
  let body = text.trim();
  if (body.startsWith("```")) {
    body = body.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  }
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start !== -1 && end !== -1) body = body.slice(start, end + 1);
  try {
    const parsed = JSON.parse(body);
    if (!parsed.name || !Array.isArray(parsed.sections)) {
      throw new Error("Resume JSON missing required fields");
    }
    return parsed as ResumeData;
  } catch (err) {
    throw new Error(
      `Could not parse resume JSON from model: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
