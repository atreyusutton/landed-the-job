import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import type Anthropic from "@anthropic-ai/sdk";

export type ExtractedProfile = {
  personal?: {
    name?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    portfolio?: string;
  };
  experiences?: {
    company: string;
    title: string;
    location?: string;
    startDate?: string; // ISO yyyy-mm or yyyy-mm-dd
    endDate?: string; // ISO or null/"present"
    current?: boolean;
    responsibilities?: string[];
    achievements?: string[];
  }[];
  projects?: {
    name: string;
    description: string;
    techStack?: string[];
    url?: string;
    outcomes?: string;
  }[];
  education?: {
    school: string;
    degree?: string;
    field?: string;
    startDate?: string;
    endDate?: string;
    gpa?: number;
  }[];
  skills?: {
    name: string;
    category: "TECHNICAL" | "SOFT" | "TOOL" | "LANGUAGE";
  }[];
  certifications?: { name: string; issuer?: string; date?: string }[];
};

const SYSTEM = `You extract structured profile data from a candidate's existing resume so it can populate their account.

Rules:
- Output STRICT JSON matching the provided schema. No prose, no markdown, no code fences.
- Never invent facts. If a field isn't in the resume, omit it entirely.
- Dates: prefer ISO format (YYYY-MM or YYYY-MM-DD). For "Present" / "Current", set "current": true and omit endDate.
- Categorize skills: TECHNICAL (programming languages, frameworks, technical concepts), TOOL (software, platforms, IDEs), LANGUAGE (spoken/written languages), SOFT (leadership, communication, etc).
- For experience bullets: split into responsibilities (ongoing duties) vs achievements (specific outcomes). When unclear, put in responsibilities.
- For projects: distinguish from work experience — projects are personal/side/academic builds.`;

const SCHEMA_DOC = `{
  "personal": { "name": string, "phone": string, "location": string, "linkedin": string, "portfolio": string },
  "experiences": [{ "company": string, "title": string, "location": string, "startDate": string, "endDate": string | null, "current": boolean, "responsibilities": string[], "achievements": string[] }],
  "projects": [{ "name": string, "description": string, "techStack": string[], "url": string, "outcomes": string }],
  "education": [{ "school": string, "degree": string, "field": string, "startDate": string, "endDate": string, "gpa": number }],
  "skills": [{ "name": string, "category": "TECHNICAL" | "SOFT" | "TOOL" | "LANGUAGE" }],
  "certifications": [{ "name": string, "issuer": string, "date": string }]
}`;

const INSTRUCTION = `Extract this candidate's resume into the JSON schema below. Output JSON only.\n\nSCHEMA:\n${SCHEMA_DOC}`;

export async function extractProfileFromFile({
  filename,
  mimeType,
  bytes,
}: {
  filename: string;
  mimeType: string;
  bytes: Buffer;
}): Promise<ExtractedProfile> {
  const content = await buildContent({ filename, mimeType, bytes });

  const res = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    system: SYSTEM,
    messages: [{ role: "user", content }],
  });

  const text = res.content
    .map((c) => (c.type === "text" ? c.text : ""))
    .join("");

  return parseJson(text);
}

async function buildContent({
  filename,
  mimeType,
  bytes,
}: {
  filename: string;
  mimeType: string;
  bytes: Buffer;
}): Promise<Anthropic.Messages.ContentBlockParam[]> {
  const lower = filename.toLowerCase();

  // PDF — use Anthropic's native document support.
  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) {
    return [
      {
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: bytes.toString("base64"),
        },
      },
      { type: "text", text: INSTRUCTION },
    ];
  }

  // Images — use vision.
  const imageType = imageMediaType(mimeType, lower);
  if (imageType) {
    return [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: imageType,
          data: bytes.toString("base64"),
        },
      },
      { type: "text", text: INSTRUCTION },
    ];
  }

  // DOCX — extract text with mammoth.
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".docx")
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: bytes });
    return [
      { type: "text", text: `RESUME TEXT (extracted from DOCX):\n\n${result.value}` },
      { type: "text", text: INSTRUCTION },
    ];
  }

  // Everything else — treat as text. Covers .txt, .md, .rtf, .html, etc.
  // Claude can interpret RTF/HTML markup directly.
  const text = bytes.toString("utf8");
  if (text.length === 0) {
    throw new Error("File is empty.");
  }
  if (text.length > 200_000) {
    throw new Error("File too large (200KB text limit).");
  }
  return [
    { type: "text", text: `RESUME TEXT:\n\n${text}` },
    { type: "text", text: INSTRUCTION },
  ];
}

function imageMediaType(
  mimeType: string,
  filename: string,
): "image/png" | "image/jpeg" | "image/gif" | "image/webp" | null {
  if (mimeType.startsWith("image/")) {
    if (["image/png", "image/jpeg", "image/gif", "image/webp"].includes(mimeType)) {
      return mimeType as "image/png" | "image/jpeg" | "image/gif" | "image/webp";
    }
  }
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
  if (filename.endsWith(".webp")) return "image/webp";
  if (filename.endsWith(".gif")) return "image/gif";
  return null;
}

function parseJson(text: string): ExtractedProfile {
  let body = text.trim();
  if (body.startsWith("```")) {
    body = body.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  }
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start !== -1 && end !== -1) body = body.slice(start, end + 1);
  try {
    return JSON.parse(body) as ExtractedProfile;
  } catch (err) {
    throw new Error(
      `Could not parse profile JSON: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
