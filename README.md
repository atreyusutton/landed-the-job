# LandedTheJob

> Your resume, rewritten to win.

AI-powered resume tailoring and cover letter generation for job seekers. Paste a job listing, get a tailored resume that mirrors its language, and a cover letter that fits the company's tone.

## Stack

Next.js 15 (App Router) · React 19 · Prisma 6 + Postgres (Neon) · Clerk auth · Stripe billing · Anthropic Claude · Tailwind 3.

## Quick start

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env
# Fill in: DATABASE_URL, Clerk keys, ANTHROPIC_API_KEY (Stripe optional for dev)

# 3. Push schema to DB
npm run db:push

# 4. Run
npm run dev
```

Open http://localhost:3000.

### Required services

- **Neon** — create a Postgres project, paste the connection string into `DATABASE_URL`.
- **Clerk** — create an app, paste publishable + secret keys.
- **Anthropic** — an API key with access to Sonnet.

### Optional (for billing)

- **Stripe** — create three Prices (`$9/mo`, `$19/mo`, `$29 one-time`) and paste the IDs.
- For local webhook testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook` and paste the signing secret into `STRIPE_WEBHOOK_SECRET`.

## Project layout

- `src/app/` — App Router pages + API routes
- `src/lib/` — Anthropic client, Prisma client, credits, rate limit, template renderers, AI prompts
- `src/components/` — shared UI (Sidebar, Form primitives, Paywall)
- `prisma/schema.prisma` — User, Experience, Project, Education, Skill, Certification, Job, Resume, CoverLetter
- `templates/` — reference HTML for resume + cover letter (visual source of truth)

See `CLAUDE.md` for the architecture deep-dive.
