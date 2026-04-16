import { requireUser } from "@/lib/user";
import { db } from "@/lib/db";
import { Field, TextArea, Select, SubmitButton } from "@/components/Form";
import {
  updatePersonal,
  updatePreferences,
  addExperience,
  removeExperience,
  addProject,
  removeProject,
  addEducation,
  removeEducation,
  addSkill,
  removeSkill,
  addCertification,
  removeCertification,
} from "./actions";

export default async function ProfilePage() {
  const user = await requireUser();
  const [experiences, projects, education, skills, certs, prefs] =
    await Promise.all([
      db.experience.findMany({
        where: { userId: user.id },
        orderBy: { startDate: "desc" },
      }),
      db.project.findMany({ where: { userId: user.id } }),
      db.education.findMany({
        where: { userId: user.id },
        orderBy: { endDate: "desc" },
      }),
      db.skill.findMany({ where: { userId: user.id } }),
      db.certification.findMany({
        where: { userId: user.id },
        orderBy: { date: "desc" },
      }),
      db.preferences.findUnique({ where: { userId: user.id } }),
    ]);

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your profile</h1>
        <p className="text-[#666] mt-1 text-sm">
          Fill this out once. It powers every resume and cover letter you generate.
        </p>
      </div>

      <Section title="Personal info">
        <form action={updatePersonal} className="grid sm:grid-cols-2 gap-4">
          <Field label="Full name" name="name" defaultValue={user.name} />
          <Field
            label="Email"
            name="email"
            type="email"
            defaultValue={user.email}
            required
          />
          <Field label="Phone" name="phone" defaultValue={user.phone} />
          <Field label="Location" name="location" defaultValue={user.location} />
          <Field label="LinkedIn URL" name="linkedin" defaultValue={user.linkedin} />
          <Field label="Portfolio URL" name="portfolio" defaultValue={user.portfolio} />
          <div className="sm:col-span-2">
            <SubmitButton>Save personal info</SubmitButton>
          </div>
        </form>
      </Section>

      <Section title="Work experience">
        <ul className="space-y-3 mb-6">
          {experiences.map((e) => (
            <li
              key={e.id}
              className="border border-[#eee] p-4 flex justify-between gap-4"
            >
              <div className="flex-1">
                <div className="font-bold text-sm">
                  {e.title} — {e.company}
                </div>
                <div className="text-xs text-[#666]">
                  {fmt(e.startDate)} – {e.current ? "Present" : fmt(e.endDate)}
                  {e.location ? ` • ${e.location}` : ""}
                </div>
                {e.responsibilities.length > 0 && (
                  <ul className="text-xs mt-2 list-disc list-inside text-[#444]">
                    {e.responsibilities.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                )}
              </div>
              <form action={removeExperience}>
                <input type="hidden" name="id" value={e.id} />
                <SubmitButton variant="ghost">Remove</SubmitButton>
              </form>
            </li>
          ))}
        </ul>
        <form action={addExperience} className="grid sm:grid-cols-2 gap-4">
          <Field label="Company" name="company" required />
          <Field label="Title" name="title" required />
          <Field label="Location" name="location" />
          <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#666] mt-6">
            <input type="checkbox" name="current" /> Currently working here
          </label>
          <Field label="Start date" name="startDate" type="date" required />
          <Field label="End date" name="endDate" type="date" />
          <div className="sm:col-span-2">
            <TextArea
              label="Responsibilities (one per line)"
              name="responsibilities"
              rows={3}
            />
          </div>
          <div className="sm:col-span-2">
            <TextArea
              label="Achievements (one per line)"
              name="achievements"
              rows={3}
            />
          </div>
          <div className="sm:col-span-2">
            <SubmitButton>Add experience</SubmitButton>
          </div>
        </form>
      </Section>

      <Section title="Projects">
        <ul className="space-y-3 mb-6">
          {projects.map((p) => (
            <li
              key={p.id}
              className="border border-[#eee] p-4 flex justify-between gap-4"
            >
              <div className="flex-1">
                <div className="font-bold text-sm">{p.name}</div>
                <div className="text-xs text-[#444] mt-1">{p.description}</div>
                {p.techStack.length > 0 && (
                  <div className="text-xs text-[#666] mt-1">
                    {p.techStack.join(" · ")}
                  </div>
                )}
              </div>
              <form action={removeProject}>
                <input type="hidden" name="id" value={p.id} />
                <SubmitButton variant="ghost">Remove</SubmitButton>
              </form>
            </li>
          ))}
        </ul>
        <form action={addProject} className="grid sm:grid-cols-2 gap-4">
          <Field label="Name" name="name" required />
          <Field label="URL" name="url" />
          <div className="sm:col-span-2">
            <TextArea label="Description" name="description" rows={2} />
          </div>
          <Field label="Tech stack (comma-separated)" name="techStack" />
          <Field label="Outcomes" name="outcomes" />
          <div className="sm:col-span-2">
            <SubmitButton>Add project</SubmitButton>
          </div>
        </form>
      </Section>

      <Section title="Education">
        <ul className="space-y-3 mb-6">
          {education.map((ed) => (
            <li
              key={ed.id}
              className="border border-[#eee] p-4 flex justify-between gap-4"
            >
              <div className="flex-1">
                <div className="font-bold text-sm">{ed.school}</div>
                <div className="text-xs text-[#666]">
                  {[ed.degree, ed.field].filter(Boolean).join(", ")}
                  {ed.endDate ? ` • ${fmt(ed.endDate)}` : ""}
                  {ed.gpa ? ` • GPA ${ed.gpa}` : ""}
                </div>
              </div>
              <form action={removeEducation}>
                <input type="hidden" name="id" value={ed.id} />
                <SubmitButton variant="ghost">Remove</SubmitButton>
              </form>
            </li>
          ))}
        </ul>
        <form action={addEducation} className="grid sm:grid-cols-2 gap-4">
          <Field label="School" name="school" required />
          <Field label="Degree" name="degree" />
          <Field label="Field of study" name="field" />
          <Field label="GPA (optional)" name="gpa" />
          <Field label="Start date" name="startDate" type="date" />
          <Field label="End date" name="endDate" type="date" />
          <div className="sm:col-span-2">
            <SubmitButton>Add education</SubmitButton>
          </div>
        </form>
      </Section>

      <Section title="Skills">
        <ul className="flex flex-wrap gap-2 mb-6">
          {skills.map((s) => (
            <li key={s.id} className="border border-[#eee] px-3 py-1 flex items-center gap-2">
              <span className="text-xs">
                <span className="text-[#666] uppercase tracking-wider">{s.category.toLowerCase()}</span>{" "}
                {s.name}
              </span>
              <form action={removeSkill}>
                <input type="hidden" name="id" value={s.id} />
                <button type="submit" className="text-[#666] hover:text-[#1a1a1a]">×</button>
              </form>
            </li>
          ))}
        </ul>
        <form action={addSkill} className="grid sm:grid-cols-3 gap-4 items-end">
          <Field label="Skill" name="name" required />
          <Select
            label="Category"
            name="category"
            defaultValue="TECHNICAL"
            options={[
              { value: "TECHNICAL", label: "Technical" },
              { value: "SOFT", label: "Soft" },
              { value: "TOOL", label: "Tool" },
              { value: "LANGUAGE", label: "Language" },
            ]}
          />
          <SubmitButton>Add skill</SubmitButton>
        </form>
      </Section>

      <Section title="Certifications & awards">
        <ul className="space-y-2 mb-6">
          {certs.map((c) => (
            <li key={c.id} className="flex justify-between items-center border border-[#eee] p-3">
              <div className="text-sm">
                <span className="font-bold">{c.name}</span>
                {c.issuer ? <span className="text-[#666]"> — {c.issuer}</span> : null}
                {c.date ? <span className="text-[#666] text-xs"> • {fmt(c.date)}</span> : null}
              </div>
              <form action={removeCertification}>
                <input type="hidden" name="id" value={c.id} />
                <SubmitButton variant="ghost">Remove</SubmitButton>
              </form>
            </li>
          ))}
        </ul>
        <form action={addCertification} className="grid sm:grid-cols-3 gap-4">
          <Field label="Name" name="name" required />
          <Field label="Issuer" name="issuer" />
          <Field label="Date" name="date" type="date" />
          <div className="sm:col-span-3">
            <SubmitButton>Add certification</SubmitButton>
          </div>
        </form>
      </Section>

      <Section title="Preferences">
        <form action={updatePreferences} className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <TextArea
              label="Target roles (one per line)"
              name="targetRoles"
              defaultValue={prefs?.targetRoles.join("\n")}
              rows={3}
            />
          </div>
          <div className="sm:col-span-2">
            <TextArea
              label="Preferred industries (one per line)"
              name="industries"
              defaultValue={prefs?.industries.join("\n")}
              rows={3}
            />
          </div>
          <Select
            label="Work style"
            name="workStyle"
            defaultValue={prefs?.workStyle ?? ""}
            options={[
              { value: "", label: "—" },
              { value: "remote", label: "Remote" },
              { value: "hybrid", label: "Hybrid" },
              { value: "onsite", label: "On-site" },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Salary min"
              name="salaryMin"
              type="number"
              defaultValue={prefs?.salaryMin ?? ""}
            />
            <Field
              label="Salary max"
              name="salaryMax"
              type="number"
              defaultValue={prefs?.salaryMax ?? ""}
            />
          </div>
          <div className="sm:col-span-2">
            <SubmitButton>Save preferences</SubmitButton>
          </div>
        </form>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-sm uppercase tracking-wider font-bold mb-4 border-b border-[#1a1a1a] pb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

function fmt(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
