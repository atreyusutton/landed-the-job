export type CoverLetterData = {
  name: string;
  contact: string[];
  greeting: string;
  paragraphs: string[];
  closing: string;
  signature: string;
};

const STYLES = `
@page { size: letter; margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 11.5px;
  line-height: 1.55;
  color: #1a1a1a;
  width: 8.5in;
  min-height: 11in;
  padding: 0.5in 0.65in;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
a { color: #1a1a1a; text-decoration: none; }
.doc-head {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1.5px solid #1a1a1a;
}
.doc-head h1 {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.contact { font-size: 11px; color: #444; letter-spacing: 0.3px; }
.greeting { font-size: 12px; font-weight: 600; margin-bottom: 14px; }
.body p { margin-bottom: 12px; text-align: left; }
.closing { margin-top: 20px; }
.closing .name { font-weight: 700; font-size: 12px; margin-top: 4px; }
@media print { body { padding: 0.5in 0.65in; } }
`;

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderContact(contact: string[]): string {
  return contact
    .map((c) =>
      /^https?:\/\//.test(c)
        ? `<a href="${escape(c)}">${escape(c.replace(/^https?:\/\//, ""))}</a>`
        : /@/.test(c)
          ? `<a href="mailto:${escape(c)}">${escape(c)}</a>`
          : escape(c),
    )
    .join(" | ");
}

export function renderCoverLetterHtml(data: CoverLetterData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escape(data.name)} — Cover Letter</title>
<style>${STYLES}</style>
</head>
<body>
<div class="doc-head">
  <h1>${escape(data.name)}</h1>
  <div class="contact">${renderContact(data.contact)}</div>
</div>
<div class="greeting">${escape(data.greeting)}</div>
<div class="body">
${data.paragraphs.map((p) => `  <p>${escape(p)}</p>`).join("\n")}
</div>
<div class="closing">
  <div>${escape(data.closing)}</div>
  <div class="name">${escape(data.signature)}</div>
</div>
</body>
</html>`;
}

export function renderCoverLetterFromContent(
  user: {
    name: string | null;
    email: string;
    phone: string | null;
    location: string | null;
    linkedin: string | null;
    portfolio: string | null;
  },
  content: string,
): string {
  const blocks = content.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const greeting = /^(hello|hi|dear|good\s+(?:morning|afternoon))/i.test(blocks[0] ?? "")
    ? blocks.shift()!
    : "Hello,";
  let closing = "Sincerely,";
  let signature = user.name ?? "";
  const last = blocks[blocks.length - 1] ?? "";
  if (/^(sincerely|best|regards|thank you|thanks)/i.test(last)) {
    const parts = last.split(/\n/);
    closing = parts[0];
    if (parts.length > 1) signature = parts.slice(1).join(" ").trim();
    blocks.pop();
  }
  return renderCoverLetterHtml({
    name: user.name ?? "",
    contact: [
      user.location,
      user.phone,
      user.email,
      user.linkedin,
      user.portfolio,
    ].filter(Boolean) as string[],
    greeting,
    paragraphs: blocks,
    closing,
    signature: signature || user.name || "",
  });
}
