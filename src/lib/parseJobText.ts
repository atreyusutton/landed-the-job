import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";

export type ParsedJobText = {
  title: string;
  company: string;
  description: string;
  requirements?: string;
  location?: string;
  salary?: string;
};

const SYSTEM = `You extract structured job-listing data from raw text the user pasted (could be from LinkedIn, a company careers page, an email, anywhere).

Rules:
- Output STRICT JSON. No prose, no markdown, no code fences.
- Never invent fields. If something isn't in the text, omit it.
- "description" is the main body / about-the-role text.
- "requirements" is the qualifications / requirements / must-haves section if separable. If not separable, omit it (the description already contains it).
- "salary" should be a clean string ("$120k–$150k", "$45/hr"). Omit if absent.
- Strip boilerplate: "Apply now", recruiter contact info, footer nav, social links.`;

const SCHEMA_DOC = `{
  "title": string,
  "company": string,
  "description": string,
  "requirements": string,
  "location": string,
  "salary": string
}`;

export async function parseJobText(text: string): Promise<ParsedJobText> {
  if (!text || text.trim().length < 30) {
    throw new Error("Pasted text is too short to be a job listing.");
  }
  if (text.length > 80_000) {
    throw new Error("Pasted text is too long (80KB max).");
  }

  const res = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 3000,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Extract this job listing into the schema below. Output JSON only.\n\nSCHEMA:\n${SCHEMA_DOC}\n\nPASTED TEXT:\n${text}`,
      },
    ],
  });

  const out = res.content.map((c) => (c.type === "text" ? c.text : "")).join("");
  return parseJson(out);
}

function parseJson(text: string): ParsedJobText {
  let body = text.trim();
  if (body.startsWith("```")) {
    body = body.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  }
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start !== -1 && end !== -1) body = body.slice(start, end + 1);
  let parsed: Partial<ParsedJobText>;
  try {
    parsed = JSON.parse(body);
  } catch (err) {
    throw new Error(
      `Could not parse job JSON: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (!parsed.title || !parsed.company || !parsed.description) {
    throw new Error(
      "The LLM couldn't find a clear job title, company, or description in that text.",
    );
  }
  return parsed as ParsedJobText;
}
