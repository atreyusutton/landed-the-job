import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import type { FullProfile } from "@/lib/generateResume";

export type CoverLetterStyle = "personal" | "formal" | "technical";

const STYLE_GUIDANCE: Record<CoverLetterStyle, string> = {
  personal:
    "Warm, first-person, conversational. Contractions are encouraged (I'm, I've, don't, it's). Show a specific, concrete reason you care about this company, not a generic enthusiasm statement.",
  formal:
    "Professional and plain-spoken. Confident, not stiff. Contractions are fine in moderation. Avoid corporate boilerplate.",
  technical:
    "Direct, specific, technical. Lead with relevant skills and accomplishments. Concrete examples. Minimal small talk. Contractions fine.",
};

const SYSTEM = `You are an expert cover letter writer. You produce tailored cover letters that:
- Reference the company specifically (mission, values, products, recent moves) using the provided context.
- Match the chosen tone exactly.
- Connect the candidate's real experience to what the role asks for. Never invent facts.
- Are 3 to 5 paragraphs, no more.
- Open with a real greeting (e.g. "Hello," or "Dear Hiring Team,") on its own line.
- End with a closing (e.g. "Sincerely,") on its own line, then the candidate's name on the next line.
- Do NOT include the candidate's contact info, date, or recipient address. Those are added separately.
- Plain text only. Separate paragraphs with blank lines. No markdown.

PUNCTUATION (strict):
- NEVER use em-dashes (—). Use commas, semicolons, or periods instead.
- NEVER use en-dashes (–). Use "to" or a hyphen or a period.
- Plain hyphens only for compound words.

OPENING BANS (never begin the letter with any of these or close variants):
- "I am writing to express my interest"
- "I am writing to apply for"
- "Please accept this letter as"
- "As a [role/title] with X years"
- "I am excited to apply"
- "I am thrilled to apply"
- "It is with great enthusiasm that"
- "I hope this letter finds you well"
- "My name is [name]"
The first sentence must say something specific about the role, the company, or the candidate's work. Not a throat-clear.

PHRASE BANS (never use anywhere in the letter):
passionate about, results-driven, proven track record, hit the ground running, dynamic team, team player, self-starter, go-getter, synergy, synergize, leverage (as a verb), leveraging, robust, seamless, seamlessly, cutting-edge, best-in-class, world-class, a perfect fit, excited to contribute, eager to bring, in today's fast-paced world, stood out to me, caught my eye, aligns with my values, would love the opportunity, I believe my skills, thrive in, tapestry, wealth of experience, deeply passionate, truly excited, transformative, game-changer, holistic, bleeding-edge, delve, unlock, empower.

WORD BANS: utilize, utilized, elevate, streamline, spearhead (unless quoted from the JD).

Prefer plain verbs: built, shipped, ran, led, wrote, fixed, cut, grew, sold, launched, owned, migrated.

HUMAN TOUCHES (required, don't over-polish):
- Include exactly ONE sentence that is noticeably short (under 10 words). Fragments are allowed if they read naturally.
- Use at least ONE contraction somewhere (I'm, I've, don't, it's, that's).
- Vary sentence length sharply. Do not produce three parallel balanced sentences in a row.
- You may start ONE sentence with "And" or "But" if the flow calls for it. Do not force it.
- Avoid triadic lists ("X, Y, and Z") more than once in the whole letter.
- Paragraphs can have uneven lengths. A one-sentence paragraph is fine if it lands.`;

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

  const raw = res.content
    .map((c) => (c.type === "text" ? c.text : ""))
    .join("")
    .trim();

  return scrubCoverLetter(raw);
}

// Safety net: strip em-dashes and fix en-dashes that slipped through the prompt.
function scrubCoverLetter(text: string): string {
  return text
    .replace(/\s*—\s*/g, ", ")
    .replace(/([^\d])–([^\d])/g, "$1-$2")
    .replace(/[ \t]+,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/,\s*\./g, ".")
    .replace(/\n{3,}/g, "\n\n");
}
