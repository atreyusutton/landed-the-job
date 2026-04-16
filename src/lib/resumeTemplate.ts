export type ResumeData = {
  name: string;
  contact: string[];
  sections: ResumeSection[];
  skills?: { label: string; items: string }[];
  education?: { degree: string; school: string }[];
};

export type ResumeSection = {
  title: string;
  entries: ResumeEntry[];
};

export type ResumeEntry = {
  title: string;
  meta?: string;
  subtitle?: string;
  bullets: string[];
};

const STYLES = `
@page { size: letter; margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 11.5px;
  line-height: 1.35;
  color: #1a1a1a;
  width: 8.5in;
  min-height: 11in;
  padding: 0.4in 0.5in;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
a { color: #1a1a1a; text-decoration: none; }
.header {
  text-align: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1.5px solid #1a1a1a;
}
.header h1 {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.contact { font-size: 11px; color: #444; letter-spacing: 0.3px; }
.contact span { margin: 0 4px; color: #999; }
.section { margin-bottom: 7px; }
.section-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  border-bottom: 0.75px solid #ccc;
  padding-bottom: 2px;
  margin-bottom: 5px;
}
.entry { margin-bottom: 5px; }
.entry:last-child { margin-bottom: 0; }
.entry-header { display: flex; justify-content: space-between; align-items: baseline; }
.entry-title { font-size: 11.5px; font-weight: 700; }
.entry-meta { font-size: 10.5px; color: #666; font-style: italic; white-space: nowrap; }
.entry-subtitle { font-size: 11px; font-weight: 600; color: #333; margin-bottom: 2px; }
ul { padding-left: 14px; margin-top: 1px; }
li { margin-bottom: 1px; padding-left: 2px; }
.skills-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 20px; }
.skill-category { font-size: 11px; }
.skill-label { font-weight: 700; }
.edu-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 20px; }
.edu-degree { font-size: 11.5px; }
.edu-school { font-size: 10.5px; color: #555; }
@media print { body { padding: 0.4in 0.5in; } }
`;

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderEntry(e: ResumeEntry): string {
  const meta = e.meta ? `<div class="entry-meta">${escape(e.meta)}</div>` : "";
  const sub = e.subtitle
    ? `<div class="entry-subtitle">${escape(e.subtitle)}</div>`
    : "";
  const bullets = e.bullets.length
    ? `<ul>${e.bullets.map((b) => `<li>${escape(b)}</li>`).join("")}</ul>`
    : "";
  return `
  <div class="entry">
    <div class="entry-header">
      <div class="entry-title">${escape(e.title)}</div>
      ${meta}
    </div>
    ${sub}
    ${bullets}
  </div>`;
}

function renderSection(s: ResumeSection): string {
  return `
<div class="section">
  <div class="section-title">${escape(s.title)}</div>
  ${s.entries.map(renderEntry).join("")}
</div>`;
}

function renderContact(contact: string[]): string {
  return contact
    .map((c) =>
      /^https?:\/\/|^mailto:|@/.test(c)
        ? c.startsWith("http")
          ? `<a href="${escape(c)}">${escape(c.replace(/^https?:\/\//, ""))}</a>`
          : `<a href="mailto:${escape(c)}">${escape(c)}</a>`
        : escape(c),
    )
    .join(' <span>|</span> ');
}

export function renderResumeHtml(data: ResumeData): string {
  const skillsBlock = data.skills?.length
    ? `
<div class="section">
  <div class="section-title">Skills</div>
  <div class="skills-grid">
    ${data.skills
      .map(
        (s) =>
          `<div class="skill-category"><span class="skill-label">${escape(s.label)}:</span> ${escape(s.items)}</div>`,
      )
      .join("")}
  </div>
</div>`
    : "";

  const eduBlock = data.education?.length
    ? `
<div class="section">
  <div class="section-title">Education</div>
  <div class="edu-grid">
    ${data.education
      .map(
        (e) =>
          `<div><div class="edu-degree"><strong>${escape(e.degree)}</strong></div><div class="edu-school">${escape(e.school)}</div></div>`,
      )
      .join("")}
  </div>
</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escape(data.name)} — Resume</title>
<style>${STYLES}</style>
</head>
<body>
<div class="header">
  <h1>${escape(data.name)}</h1>
  <div class="contact">${renderContact(data.contact)}</div>
</div>
${data.sections.map(renderSection).join("")}
${skillsBlock}
${eduBlock}
</body>
</html>`;
}
