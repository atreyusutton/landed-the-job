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

function decodeEntities(html: string): string {
  return html
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripHtml(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<\/(p|li|h[1-6]|div|tr|br)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function findMeta(html: string, names: string[]): string | undefined {
  for (const name of names) {
    const re = new RegExp(
      `<meta[^>]+(?:name|property)\\s*=\\s*["']${name}["'][^>]*content\\s*=\\s*["']([^"']+)["']`,
      "i",
    );
    const m = re.exec(html);
    if (m?.[1]) return decodeEntities(m[1]);
  }
  return undefined;
}

function extractJsonLdJobPosting(html: string): Partial<ParsedJob> | undefined {
  const re = /<script[^>]+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const blocks: RegExpExecArray[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) blocks.push(m);
  for (const b of blocks) {
    let raw = b[1].trim();
    raw = raw.replace(/^\s*\/\/.*$/gm, "");
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    const items = Array.isArray(parsed) ? parsed : [parsed];
    for (const item of items) {
      const node = unwrapGraph(item);
      if (!node) continue;
      if (node["@type"] === "JobPosting" || (Array.isArray(node["@type"]) && node["@type"].includes("JobPosting"))) {
        return jobPostingToParsed(node);
      }
    }
  }
  return undefined;
}

type Json = Record<string, unknown>;

function unwrapGraph(node: unknown): Json | undefined {
  if (!node || typeof node !== "object") return undefined;
  const obj = node as Json;
  if (Array.isArray(obj["@graph"])) {
    for (const g of obj["@graph"] as unknown[]) {
      const inner = unwrapGraph(g);
      if (inner && (inner["@type"] === "JobPosting" || (Array.isArray(inner["@type"]) && inner["@type"].includes("JobPosting")))) {
        return inner;
      }
    }
  }
  return obj;
}

function jobPostingToParsed(node: Json): Partial<ParsedJob> {
  const org = node.hiringOrganization as Json | string | undefined;
  const company =
    typeof org === "string"
      ? org
      : (org?.name as string | undefined);
  const loc = node.jobLocation as Json | Json[] | undefined;
  const firstLoc = Array.isArray(loc) ? loc[0] : loc;
  const address = firstLoc?.address as Json | undefined;
  const location = address
    ? [address.addressLocality, address.addressRegion, address.addressCountry]
        .filter(Boolean)
        .join(", ")
    : (node.applicantLocationRequirements as Json | undefined)?.name as string | undefined;
  const salaryNode = node.baseSalary as Json | undefined;
  const salaryValue = salaryNode?.value as Json | undefined;
  const salary = salaryValue
    ? `${salaryValue.minValue ?? ""}${
        salaryValue.maxValue ? `–${salaryValue.maxValue}` : ""
      } ${salaryValue.unitText ?? salaryNode?.currency ?? ""}`.trim()
    : undefined;
  const description =
    typeof node.description === "string"
      ? stripHtml(node.description)
      : undefined;

  return {
    title: node.title as string | undefined,
    company,
    location,
    salary,
    description,
  } as Partial<ParsedJob>;
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

  const ld = extractJsonLdJobPosting(html) ?? {};
  const ogTitle = findMeta(html, ["og:title", "twitter:title"]);
  const ogDesc = findMeta(html, ["og:description", "description"]);
  const ogSite = findMeta(html, ["og:site_name"]);
  const titleTag =
    /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim() ?? "";

  const title = (ld.title || ogTitle || titleTag).split(/[|·\-—]/)[0].trim();
  const company = (ld.company || ogSite || titleTag.split(/[|·\-—]/)[1]?.trim() || "").trim();
  const description =
    ld.description ||
    ogDesc ||
    stripHtml(html).slice(0, 8000);

  if (!title) {
    throw new Error(
      "Could not extract a job title from this URL. Try pasting the listing manually.",
    );
  }

  return {
    title,
    company: company || "Unknown company",
    description,
    requirements: ld.requirements,
    location: ld.location,
    salary: ld.salary,
    source,
  };
}
