# LandedTheJob — Claude Code Build Prompt
**Company:** LandedTheJob | **Domain:** landedthejob.com | **Tagline:** *"Your resume, rewritten to win."*

---

## Stack
- Next.js 14 (App Router)
- Neon (Postgres database)
- Vercel (hosting + edge functions)
- Clerk or Supabase Auth (auth + user management)
- Stripe (payments)
- Tailwind CSS
- Claude API (`claude-sonnet-4-20250514`) for all AI generation
- Prisma ORM (connects Next.js to Neon)

---

## Auth & Accounts
- Email/password and Google OAuth
- User profile persists across sessions
- Protected routes for all dashboard pages
- Store user record in Neon on first sign-in

---

## User Profile / Catalog
The core data model. Users fill this out once and it powers everything.

Store all fields in Neon with a normalized Prisma schema. Allow full CRUD on every section.

**Fields:**
- Personal info (name, email, phone, location, LinkedIn URL, portfolio URL)
- Work experience (company, title, start/end dates, responsibilities, achievements — multiple entries)
- Projects (name, description, tech stack, URL, outcomes)
- Education (school, degree, field, dates, GPA optional)
- Skills (categorized: technical, soft, tools, languages)
- Certifications and awards (name, issuer, date)
- Preferences (target roles, preferred industries, work style: remote/hybrid/on-site, salary range)

---

## Resume Builder
- User selects a job to tailor to (from saved jobs or paste job description manually)
- Claude rewrites the user's experiences, skills, and bullet points to match the job description and its keywords
- Output renders using the HTML/CSS resume template found in `/templates/resume.html` in the repo — replicate that style exactly as the default template
- Preview rendered in-browser in an iframe or styled div
- Download as HTML button
- Print-to-PDF instructions shown in a modal: *"File → Print → Save as PDF, set margins to None"*
- Scaffold a template picker UI for future templates (one template at launch)

---

## Cover Letter Generator
- User inputs: job title (or pulled from saved job listing) + company website URL
- Claude reads the company site to extract tone, mission, and values
- User selects writing style: **Personal**, **Formal**, or **Technical**
- Claude generates a tailored cover letter referencing the company specifically
- Cover letter follows the same visual style as the resume template in `/templates/`
- Editable in a rich text box before downloading
- Same preview + download + print-to-PDF flow as resume

---

## Job Listing Importer
- Input field accepts URLs from: LinkedIn Jobs, Indeed, Glassdoor, ZipRecruiter, Lever, Greenhouse, Workday
- App fetches and parses the listing to extract: job title, company name, description, requirements, location, salary (if present)
- Parsed listing saved to the user's Jobs list in Neon
- From any saved job the user can one-click generate a tailored resume or cover letter

---

## Credit System & Paywall
- Every new user gets **3 free credits** on signup
- 1 credit = 1 AI generation (resume or cover letter)
- Credits tracked in Neon on the user record
- When credits hit 0, a paywall modal appears blocking generation
- Stripe integration:
  - **$9/month** — 20 generations/month
  - **$19/month** — Unlimited generations
  - **$29 one-time** — 50 credit pack
- Use Stripe Checkout for payment flow
- Stripe webhook updates Neon on successful payment/subscription
- Current credit count always visible in the nav

---

## Dashboard
- Overview: credit balance, recent resumes, recent cover letters, saved jobs
- Sidebar navigation: Profile, Resume Builder, Cover Letter, Jobs, Settings
- Settings: manage subscription, Stripe Customer Portal link, change password, delete account

---

## Additional Features
- Duplicate and edit past resumes/cover letters without regenerating
- **"Improve this bullet" micro-tool** — highlight any bullet point, Claude strengthens it (no credit cost)
- Mobile responsive layout
- Loading states and skeleton loaders on all AI calls
- Error handling and retry logic on AI and fetch endpoints
- Rate limiting on AI API routes to prevent abuse

---

## Neon / Prisma Schema (key models)

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  credits       Int      @default(3)
  stripeId      String?
  plan          String   @default("free")
  createdAt     DateTime @default(now())
  experiences   Experience[]
  projects      Project[]
  education     Education[]
  skills        Skill[]
  certs         Certification[]
  jobs          Job[]
  resumes       Resume[]
  coverLetters  CoverLetter[]
}

model Job {
  id          String   @id @default(cuid())
  userId      String
  title       String
  company     String
  description String
  url         String?
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
}

model Resume {
  id        String   @id @default(cuid())
  userId    String
  jobId     String?
  html      String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}

model CoverLetter {
  id        String   @id @default(cuid())
  userId    String
  jobId     String?
  content   String
  style     String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}
```

---

## Vercel Configuration
- Deploy on Vercel connected to GitHub repo
- Set all environment variables in Vercel dashboard
- Use Vercel Edge Functions for job listing fetching (better performance on external fetches)
- Enable Vercel Analytics

---

## Environment Variables

```
# Neon
DATABASE_URL=

# Auth (Clerk or Supabase)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# App
NEXT_PUBLIC_APP_URL=https://landedthejob.com
```

---

## Repo Structure Notes
- Resume HTML template lives at `/templates/resume.html` — Claude Code should read this file and replicate its styles exactly for all resume output
- Cover letter should follow the same typographic and color style as the resume template
- Do not invent a template style — use what's in the repo

---

## Branding
- **Name:** LandedTheJob
- **Domain:** landedthejob.com
- **Tagline:** *"Your resume, rewritten to win."*
- UI should be clean, professional, and minimal — a tool for job seekers, not a marketing site
- Use the color palette and typography from `/templates/resume.html` as the design foundation for the whole app

---

## Build Order (recommended)
1. Neon + Prisma schema + migrations
2. Auth + user creation flow
3. Profile/Catalog CRUD
4. Job Listing Importer
5. Resume Builder (AI generation + template rendering)
6. Cover Letter Generator
7. Credit system
8. Stripe integration + webhook
9. Dashboard + Settings
10. Polish: loading states, error handling, mobile responsiveness
