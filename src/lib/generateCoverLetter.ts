import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import type { FullProfile } from "@/lib/generateResume";

export type CoverLetterStyle = "personal" | "formal" | "technical";

const STYLE_GUIDANCE: Record<CoverLetterStyle, string> = {
  personal:
    "Warm, first-person, conversational. Show genuine enthusiasm and a clear personal connection to the company. Avoid corporate clichés.",
  formal:
    "Professional and polished. Confident but reserved tone. Standard business letter conventions.",
  technical:
    "Direct, specific, technical. Lead with relevant skills and accomplishments. Use precise language and concrete examples. Minimal small talk.",
};

const SYSTEM = `You are an expert cover letter writer. You produce tailored cover letters that:
- Reference the company specifically (mission, values, products, recent moves) using the provided context.
- Match the chosen tone exactly.
- Connect the candidate's real experience to what the role asks for — never invent facts.
- Are 3–5 paragraphs, no more.
- Open with a real greeting (e.g. "Hello," or "Dear Hiring Team,") on its own line.
- End with a closing (e.g. "Sincerely,") on its own line, then the candidate's name on the next line.
- Do NOT include the candidate's contact info, date, or recipient address — those are added separately.
- Plain text only. Separate paragraphs with blank lines. No markdown.`;

async function fetchCompanyContext(url: string): Promise<string> {
  if (!url || !/^https?:\/\//i.test(url)) return "";
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (LandedTheJob/1.0)",
        Accept: "text/html",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text.slice(0, 6000);
  } catch {
    return "";
  }
}

function buildProfileBlock(p: FullProfile): string {
  return `Name: ${p.name ?? ""}
Location: ${p.location ?? ""}
Top experiences:
${p.experiences
  .slice(0, 4)
  .map((e) => `- ${e.title} @ ${e.company}: ${[...e.responsibilities, ...e.achievements].slice(0, 3).join(" | ")}`)
  .join("\n")}
Notable projects:
${p.projects
  .slice(0, 4)
  .map((pr) => `- ${pr.name}: ${pr.description}`)
  .join("\n")}
Skills: ${p.skills.map((s) => s.name).join(", ")}`;
}

export async function generateCoverLetterContent({
  profile,
  jobTitle,
  company,
  jobDescription,
  companyUrl,
  style,
}: {
  profile: FullProfile;
  jobTitle: string;
  company: string;
  jobDescription: string;
  companyUrl?: string;
  style: CoverLetterStyle;
}): Promise<string> {
  const companyContext = companyUrl ? await fetchCompanyContext(companyUrl) : "";

  const userPrompt = `ROLE: ${jobTitle} at ${company}

JOB DESCRIPTION:
${jobDescription}

${companyContext ? `COMPANY CONTEXT (from ${companyUrl}):\n${companyContext}\n` : ""}
CANDIDATE PROFILE:
${buildProfileBlock(profile)}

STYLE: ${style.toUpperCase()} — ${STYLE_GUIDANCE[style]}

Write the cover letter now.`;

  const res = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1500,
    system: SYSTEM,
    messages: [{ role: "user", content: userPrompt }],
  });

  return res.content
    .map((c) => (c.type === "text" ? c.text : ""))
    .join("")
    .trim();
}
