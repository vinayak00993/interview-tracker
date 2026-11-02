# Interview Tracker — Claude Code Project Guide

## Project Overview

An **AI-powered interview intelligence platform** for tracking opportunities, preparing for interviews, and capturing debriefs across an active job search. Positioning: "Prep smarter, debrief faster, land the role." The tracker is the container; the AI coaching layer is the product.

### What It Does

- Multiple simultaneous opportunities at different pipeline stages (Kanban)
- Round-specific AI prep sheets, generated from resume + JD + every earlier debrief, stored per round
- Debrief capture with sentiment; the debrief form shows the gaps the last prep flagged
- Streamed follow-up email drafts, saved per interview, with a "sent" audit trail
- Recruiter and hiring manager contacts, documents sent per opportunity
- Offer extraction from letters, side-by-side comparison, streamed AI advisor
- Follow-up reminders (explicit dates plus stale-opportunity detection) in the sidebar
- Status change audit trail, CSV and full JSON export

## Tech Stack

- **Framework**: Next.js 14 (App Router), server components by default, server actions for mutations
- **Database**: SQLite everywhere via Prisma + `@prisma/adapter-libsql`. Local dev: a file (`prisma/dev.db`). Production: Turso over libsql. One client, one set of generated types (`src/lib/prisma.ts`).
- **Auth**: NextAuth.js, credentials (bcrypt) + Google (identity scopes only; no tokens stored)
- **AI**: `@anthropic-ai/sdk`, tiered router in `src/lib/ai/client.ts` (fast = Haiku for extraction/OCR, standard = Sonnet for prep and follow-ups, deep = Opus for the offer advisor). Structured outputs via `messages.parse` + zod; streaming via NDJSON (`src/lib/ai/stream.ts`).
- **Validation**: zod schemas in `src/lib/validation.ts`, shared by REST routes and server actions
- **Styling**: Tailwind, Earthen Manuscript palette (ink / terracotta / umber / sage / vellum). The legacy `warm-*` / `terra*` palette is gone; do not reintroduce it.
- **Tests**: Vitest against a throwaway SQLite file (`tests/`), CI in `.github/workflows/ci.yml` (typecheck, lint, test, build)
- **Deployment**: Railway (hosting) + Turso. `npm start` runs `scripts/migrate.mjs` before `next start`.
- **Live URL**: https://interviewtracker.up.railway.app

## Environment Variables

```
DATABASE_URL=file:./dev.db              # Local SQLite, relative to prisma/
TURSO_DATABASE_URL=libsql://...turso.io # Production; wins over DATABASE_URL when set
TURSO_AUTH_TOKEN=...                     # Trimmed on read (trailing newlines break the header)
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-...             # Required for every AI feature
GOOGLE_CLIENT_ID=...                     # Optional, Google sign-in
GOOGLE_CLIENT_SECRET=...
```

## Data Model (`prisma/schema.prisma`)

Timestamps are ISO 8601 **strings** in TEXT columns (the production database predates Prisma and stores text dates). Always write them with `nowIso()` from `src/lib/time.ts`. Booleans are INTEGER 0/1.

- **User** (+ **UserProfile**: resumeText, linkedInAbout, linkedInUrl)
- **Opportunity**: company, role, jdLink, jdText (cached JD), website, comp range ($K), location, remote, fitScore, priority, tier, status, appliedDate, source, followUpAt, notes, prosConsNotes, keyGaps
- **Interview**: round, roundNumber, dateTime, durationMin, format, interviewer, prepNotes, debriefNotes, questionsAsked, questionsToAsk, status, sentiment, nextSteps
- **InterviewPrep**: structured JSON prep sheet (`PrepSheet` in `src/lib/ai/prep.ts`), model, promptVersion, token counts; optional interviewId
- **FollowUpDraft**: subject, body, model, sentAt; per interview
- **Contact** + **OpportunityContact** (role per opportunity)
- **Document** + **OpportunityDocument** (sentAt)
- **Activity**: typed timeline incl. `status_change`, `followed_up`, `emailed`, `offer_received`
- **Offer**: comp, equity, benefits, rawText, aiSummary; one per opportunity
- **RateLimit**: fixed-window counters (login, registration)

### Schema changes

1. Edit `prisma/schema.prisma`.
2. Mirror it in `scripts/migrate.mjs` (CREATE TABLE IF NOT EXISTS for new tables; add an entry to `COLUMNS` for new columns). This script is the only migration mechanism; Prisma Migrate is not used because Turso is reached through the driver adapter.
3. `npx prisma generate`, then `npm run db:migrate`.

## File Structure

```
src/
├── app/
│   ├── layout.tsx, page.tsx (landing), login/, demo/, faq/, privacy/, terms/, not-found.tsx
│   ├── (app)/                      # signed-in shell: header, nav, mobile tab bar
│   │   ├── layout.tsx
│   │   ├── dashboard/              # pipeline board + sidebar; comp/; offers/
│   │   ├── opportunities/[id]/     # layout (header + tabs) + route-based tabs:
│   │   │   ├── page.tsx (overview), interviews/, prep/, notes/, contacts/, activity/
│   │   ├── contacts/, documents/, profile/
│   └── api/                        # REST routes (same schemas as the actions)
│       ├── auth/, opportunities/, interviews/, contacts/, documents/, activities/
│       ├── offers/ (+ parse, advise), parse-jd/, parse-screenshots/
│       ├── ai-prep/, ai-followup/, followups/[id]/sent/, profile/, export/
├── components/
│   ├── ui/ (primitives, Dialog, Markdown), app/ (shell), pipeline/, dashboard/
│   ├── opportunity/, comp/, offers/, contacts/, documents/, profile/, marketing/
│   ├── CompanyAvatar.tsx, Logo.tsx
├── lib/
│   ├── prisma.ts, time.ts, format.ts, pipeline.ts, validation.ts, session.ts, api.ts
│   ├── safe-fetch.ts (SSRF-guarded fetch), jd.ts (job posting parsing)
│   ├── data/ (all queries, scoped by userId), actions/ (server actions), ai/ (router, prep, followup, offers, screenshots, stream)
scripts/migrate.mjs                 # idempotent schema migration, runs on start
prisma/schema.prisma, prisma/seed.ts
tests/                              # vitest
```

## Commands

```bash
npm install                # also runs prisma generate
npm run db:setup           # migrate + seed demo account (demo@example.com / demo12345678)
npm run dev
npm run typecheck && npm run lint && npm test
npm run build
```

## Implementation Rules

- Every query takes `userId` and scopes by it. Never trust an id from the client without the user scope.
- Validate every write with the zod schemas in `src/lib/validation.ts`. Forms send strings; the schemas coerce.
- Mutations from UI go through server actions in `src/lib/actions/*` and call `revalidatePath`. The REST routes exist for scripts and future extensions and reuse the same data functions.
- Fetching user-supplied URLs goes through `safeFetch` (private networks, redirects, size and time limits).
- AI tier selection is server-side only. Prep sheets are structured JSON; keep `PrepSheetSchema` and `PREP_PROMPT_VERSION` in sync when the prompt changes.
- Client components must not import `@/lib/ai` (it pulls the SDK). Import `@/lib/ai/stream` for the NDJSON reader and use type-only imports for `PrepSheet`.
- Copy style: plain English, no em dashes or en dashes.

## Security

- bcrypt password hashes, JWT sessions, HTTP-only cookies
- Database-backed rate limits for login (per IP and per account) and registration
- Security headers in `src/middleware.ts` (CSP without `unsafe-eval` in production, frame-ancestors none)
- SSRF guard on every outbound fetch of user-supplied URLs
- Google sign-in requests identity scopes only; no OAuth tokens are stored
- Auth never logs email addresses

## Multi-Agent Workflow

- **Claude Code (supervised)** may push to master; the owner reviews live.
- **Constable (autonomous)** never pushes to master. Uses `agent/<feature>` branches and opens PRs. Cursor Bugbot reviews every PR; CI must be green.
- Before starting: `git pull origin master`, check open PRs and `agent/*` branches.
- Railway auto-deploys from master. `npm start` migrates first, so new tables and columns appear on deploy.

## Roadmap

- [ ] Free/Pro tier gating for AI features
- [ ] Company research automation
- [ ] Mock Q&A mode with AI feedback
- [ ] Chrome extension for one-click save from job boards (the REST routes are ready for it)
- [ ] Weekly pipeline email digest
- [ ] Coach/advisor read-only view
