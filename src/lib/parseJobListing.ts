import { parseJobText } from "@/lib/parseJobText";

export type ParsedJob = {
  title: string;
  company: string;
  description: string;
  requirements?: string;
  location?: string;
  salary?: string;
  source?: string;
};

const SOURCE_MAP: Record<string, string> = {
  "linkedin.com": "LinkedIn",
  "indeed.com": "Indeed",
  "glassdoor.com": "Glassdoor",
  "ziprecruiter.com": "ZipRecruiter",
  "lever.co": "Lever",
  "greenhouse.io": "Greenhouse",
  "myworkdayjobs.com": "Workday",
  "workday.com": "Workday",
};

function detectSource(url: string): string | undefined {
  try {
    const host = new URL(url).hostname.toLowerCase();
    for (const [needle, label] of Object.entries(SOURCE_MAP)) {
      if (host.includes(needle)) return label;
    }
    return host.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

/**
 * Strip HTML to plain text, preserving paragraph breaks.
 * Drops scripts, styles, nav/footer/header chrome, and SVG.
 * Decodes the common entities so what we hand the LLM is readable.
 */
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<(nav|footer|header|aside)[\s\S]*?<\/\1>/gi, "")
    .replace(/<\/(p|li|h[1-6]|div|tr|br|section)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function parseJobUrl(url: string): Promise<ParsedJob> {
  const source = detectSource(url);

  let html = "";
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (LandedTheJob/1.0; +https://landedthejob.com/bot)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      throw new Error(`Fetch failed: ${res.status}`);
    }
    html = await res.text();
  } catch (err) {
    throw new Error(
      `Could not fetch the job listing. ${err instanceof Error ? err.message : ""}`.trim(),
    );
  }

  const text = htmlToText(html);
  if (text.length < 100) {
    throw new Error(
      "The page returned almost no readable text — it's probably gated or rendered in JavaScript. Try the paste box instead.",
    );
  }

  // Cap at 60KB so we never send a huge page to the LLM.
  const trimmed = text.slice(0, 60_000);

  const parsed = await parseJobText(trimmed);
  return { ...parsed, source };
}
