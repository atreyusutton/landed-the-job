# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

LandedTheJob — AI-powered resume tailoring + cover letter generation for job seekers.

The product spec lives in `docs-spec.md`. It's the source of truth for product decisions; consult it whenever scope is unclear.

## Stack

- **Next.js 15** (App Router, React 19) — note: spec said "Next 14" but Clerk 7 dropped support
- **Prisma 6** + **Postgres** (designed for Neon)
- **Clerk 7** for auth
- **Stripe** for billing
- **Anthropic SDK** with model `claude-sonnet-4-6` (override via `ANTHROPIC_MODEL`)
- **Tailwind 3** for styling

## Commands

```bash
npm run dev          # next dev
npm run build        # prisma generate && next build
npm run lint
npm run db:push      # prisma db push (dev/prototyping)
npm run db:migrate   # prisma migrate dev
npm run db:studio    # prisma studio
```

`npm install` runs `prisma generate` automatically (`postinstall` hook). `next build` re-runs it.

## Required env vars

Copy `.env.example` to `.env` and fill in. Bare minimum for `next dev`:
- `DATABASE_URL` — Neon connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- `ANTHROPIC_API_KEY`

Stripe vars are only needed when exercising checkout/webhook. The three `STRIPE_PRICE_*` vars must be real Stripe Price IDs (one subscription price for $9/mo, one for $19/mo unlimited, one for the $29 credit pack).

## Architecture

- **Auth + user provisioning.** Clerk owns sessions; `src/lib/user.ts:requireUser` upserts a `User` row in Postgres on first sign-in (granting 3 free credits). Every protected page/server action calls `requireUser()` first. The Clerk middleware (`src/middleware.ts`) guards everything except `/`, `/sign-in`, `/sign-up`, and `/api/stripe/webhook`.

- **Templates are canonical.** `templates/resume.html` and `templates/cover-letter.html` are reference designs. Their styles are copied into `src/lib/resumeTemplate.ts` and `src/lib/coverLetterTemplate.ts` so generated HTML matches exactly. If you change the template files, update the renderer constants — they don't read from disk.

- **AI generation produces JSON, renderer produces HTML.** Resume generation asks Claude for a structured `ResumeData` JSON, which we render into the template. This keeps the template canonical and avoids prompt-injection altering the layout. Cover letters are produced as plain text (greeting + paragraphs + closing) and split into the template.

- **Credits are gated atomically.** `src/lib/credits.ts:consumeCredit` uses `updateMany` with a `credits > 0` filter, so concurrent generations can't overspend. Unlimited plan is a no-op. Failed AI calls **refund** the credit by incrementing — both generator actions do this.

- **Stripe webhook is the only writer of `plan`/`credits` for paid changes.** `src/app/api/stripe/webhook/route.ts` handles `checkout.session.completed`, subscription lifecycle, and `invoice.paid` (renewal re-grants monthly credits). Webhook is excluded from Clerk middleware so Stripe can hit it unauthenticated.

- **Job importer.** `src/app/api/jobs/import/route.ts` (Node runtime — Edge can't use vanilla Prisma without the Neon adapter, deferred). Parsing is best-effort: JSON-LD `JobPosting` schema first, OG tags + `<title>` fallback. If parsing fails the user can paste manually via `/dashboard/jobs/new`.

- **Rate limiting** is in-memory (`src/lib/rateLimit.ts`). Fine for single-instance dev. For multi-instance prod, swap in Redis/Upstash.

- **"Improve this bullet"** (`/api/improve-bullet`) is the one AI feature that does NOT consume credits, per spec.

## Routing layout

```
/                              → marketing landing
/sign-in, /sign-up             → Clerk
/dashboard                     → overview (recent resumes/letters/jobs, quick actions)
/dashboard/profile             → catalog CRUD (personal, experiences, projects, education, skills, certs, prefs)
/dashboard/jobs                → list
/dashboard/jobs/new            → URL import + manual paste
/dashboard/jobs/[id]           → view + actions (tailor resume, write cover letter)
/dashboard/resumes             → list
/dashboard/resumes/new         → pick job → generate
/dashboard/resumes/[id]        → preview iframe + download + print-to-PDF modal
/dashboard/cover-letters       → list
/dashboard/cover-letters/new   → pick job + company URL + style → generate
/dashboard/cover-letters/[id]  → editable textarea + live preview
/dashboard/settings            → plans + Stripe portal
```

API routes:
```
/api/jobs/import               → POST { url } → parsed Job row
/api/improve-bullet            → POST { text, jobContext? } → rewritten bullet (free)
/api/resumes/[id]/html         → GET → rendered resume HTML (auth-scoped)
/api/cover-letters/[id]/html   → GET → rendered cover letter HTML (auth-scoped)
/api/stripe/checkout           → POST { plan } → Checkout Session URL
/api/stripe/portal             → POST → Billing Portal URL
/api/stripe/webhook            → POST → Stripe event handler (public, signature-verified)
```

## Things to know

- The original spec pinned `claude-sonnet-4-20250514`. We use `claude-sonnet-4-6` (Sonnet 4.6, the current Sonnet as of 2026). One-line change in `src/lib/anthropic.ts` or override via `ANTHROPIC_MODEL`.
- The Stripe API version is pinned to `2026-03-25.dahlia` (matches the SDK's `LatestApiVersion`).
- Prisma 7 introduced a breaking config change (datasource URL moved out of `schema.prisma`). We pin to Prisma 6 to keep the schema-only approach.
