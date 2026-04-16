# Interview Tracker — Claude Code Project Guide

## Project Overview

An **AI-powered interview intelligence platform** for tracking opportunities, preparing for interviews, and capturing debriefs across an active job search. Positioning: "Prep smarter, debrief faster, land the role." The tracker is the container — the AI coaching layer is the product.

### What It Does

A personal interview intelligence platform that handles:

- Multiple simultaneous opportunities at different pipeline stages
- AI-generated interview prep tailored to resume + JD
- Interview debrief capture with sentiment tracking
- Recruiter and hiring manager contact tracking
- Comp comparison across the full pipeline
- Timeline visualization of where each opportunity stands

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: SQLite via Prisma ORM (local dev: better-sqlite3, production: Turso HTTP API)
- **Auth**: NextAuth.js with credentials provider (multi-user with registration)
- **AI**: Claude API via @anthropic-ai/sdk (Sonnet for prep, Haiku for vision/OCR)
- **Styling**: Tailwind CSS (warm palette: terra/ecru/reds)
- **Resume Parsing**: mammoth (.docx), plaintext (.txt)
- **Deployment**: Railway (hosting) + Turso (SQLite cloud)
- **Live URL**: https://interviewtracker.up.railway.app

## Environment Variables

```
DATABASE_URL=file:./dev.db              # Local SQLite
TURSO_URL=libsql://...turso.io          # Production DB
TURSO_TOKEN=...                          # Turso auth token
NEXTAUTH_SECRET=...                      # Session encryption
NEXTAUTH_URL=http://localhost:3000       # Auth callback base
ANTHROPIC_API_KEY=sk-ant-...             # Claude API for AI features
GOOGLE_CLIENT_ID=...apps.googleusercontent.com  # Google OAuth client ID
GOOGLE_CLIENT_SECRET=...                 # Google OAuth client secret
```

## Data Model (Prisma schema in `/prisma/schema.prisma`)

### Core Entities

1. **Opportunity** — A role at a company (e.g., "Anthropic — BD, Strategic Technology Partnerships")
   - Fields: company, role, JD link, comp range (min/max in $K), location, remote, fit score (0-100), status, priority, tier (1-3), source, notes, prosConsNotes, keyGaps, appliedDate

2. **Interview** — A specific interview event tied to an opportunity
   - Fields: round name, round number, date/time, duration, format (phone/video/onsite/async), interviewer name + title + LinkedIn, prep notes, debrief notes, questions asked/to ask, status, sentiment (positive/neutral/negative), next steps

3. **Contact** — People involved in the process
   - Fields: name, title, company, email, phone, LinkedIn, type (recruiter/hiring_manager/referral/peer/mentor/other), warmth (cold/warm/hot), notes, lastContactedAt

4. **Activity** — Timeline of all actions taken
   - Fields: type (applied/emailed/interviewed/followed_up/researched/offer_received/rejected/withdrew/note), description, opportunity link, date

5. **Document** — Track which materials were sent where
   - Fields: type (resume/cover_letter/portfolio/references/other), name, version, notes, filePath

6. **UserProfile** — Resume + LinkedIn data for AI prep
   - Fields: resumeText, linkedInAbout, linkedInUrl

## Feature Status

### Phase 1 — Core Dashboard ✅ COMPLETE
- [x] Kanban pipeline (drag-and-drop between 6 status columns)
- [x] Opportunity detail with Overview, Interviews, Prep, Notes, Contacts, Activity tabs
- [x] Quick-add forms with JD URL auto-parsing and screenshot OCR
- [x] Upcoming interviews widget + recent activity sidebar
- [x] Search and filter (company/role/location, priority, tier)
- [x] Edit opportunity inline, delete with confirmation
- [x] Multi-user auth with registration + sign-out
- [x] User profile with resume upload (.docx/.txt) + LinkedIn info

### Phase 2 — Intelligence Layer (IN PROGRESS)
- [x] AI interview prep (Claude Sonnet — tailored to resume + JD + debriefs)
- [x] Comp comparison visualization (horizontal bar chart across pipeline)
- [x] Interview debrief capture with sentiment tracking
- [x] Screenshot OCR via Claude Vision (Haiku)
- [ ] Follow-up reminders and cadence tracking
- [ ] Status change audit trail
- [ ] Data export (CSV, JSON)
- [ ] AI follow-up email drafts after debriefs
- [ ] Debrief intelligence loop (prior debriefs inform future prep)

### Phase 3 — Productization
- [ ] Free/Pro tier gating ($19/mo for AI features)
- [ ] Company research automation (news, Glassdoor, headcount)
- [ ] Mock Q&A mode (practice questions with AI feedback)
- [ ] Negotiation intelligence (comp leverage across pipeline)
- [ ] Chrome extension for one-click save from job boards
- [ ] Weekly pipeline email digest
- [ ] Coach/advisor read-only view
- [ ] Docker containerization

### Known Design Debt
- [ ] **Logo is a placeholder.** The current serif-I-on-terracotta mark in `src/components/Logo.tsx` + `src/app/icon.svg` + `src/app/apple-icon.svg` was shipped quickly to replace the default Next.js globe favicon. It's not the final brand — revisit before any public launch.

## Design Direction

Warm, premium personal tool — think Linear meets Notion, not a generic CRUD app.

- **Warm palette**: Terra (terracotta red), ecru, warm grays — not cool blue/indigo
- **Frosted glass**: Backdrop-blur, transparency on cards and headers
- **Motion**: Fade-in, slide-up, stagger animations; hover lift on cards
- **Texture**: Subtle paper-grain noise overlay
- **Dense but readable**: Power-user tool, not a marketing site
- **Status colors**: Terra = interviewing, amber = applied, warm gray = saved, green = offer, red = rejected, purple = withdrawn

## File Structure

```
interview-tracker/
├── CLAUDE.md
├── prisma/schema.prisma
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Landing redirect
│   │   ├── login/page.tsx              # Login + registration
│   │   ├── dashboard/
│   │   │   ├── page.tsx                # Main Kanban dashboard
│   │   │   ├── KanbanBoard.tsx         # Drag-and-drop pipeline
│   │   │   ├── LogoutButton.tsx        # Sign-out
│   │   │   ├── loading.tsx             # Skeleton loader
│   │   │   └── comp/                   # Comp comparison page
│   │   ├── opportunities/[id]/
│   │   │   ├── page.tsx
│   │   │   ├── OpportunityDetail.tsx   # Detail view (1200+ lines)
│   │   │   └── loading.tsx             # Skeleton loader
│   │   ├── profile/
│   │   │   ├── page.tsx
│   │   │   └── ProfileForm.tsx         # Resume + LinkedIn upload
│   │   └── api/
│   │       ├── auth/[...nextauth]/     # NextAuth
│   │       ├── auth/register/          # User registration
│   │       ├── opportunities/          # CRUD + status change
│   │       ├── interviews/             # CRUD
│   │       ├── parse-jd/              # JD URL scraping
│   │       ├── parse-screenshots/     # Claude Vision OCR
│   │       ├── ai-prep/              # AI interview prep generation
│   │       ├── profile/              # Profile CRUD + file upload
│   │       └── export/               # Data export (CSV/JSON)
│   └── lib/
│       ├── db.ts                      # Database client + queries
│       └── auth.ts                    # NextAuth config
└── public/
```

## Commands

```bash
npm install                # Install dependencies
npx prisma generate        # Generate Prisma client
npx prisma db push         # Push schema to DB
npx prisma db seed         # Seed with sample data
npm run dev                # Dev server (localhost:3000)
npm run build              # Production build
```

## Important Implementation Notes

- All dates stored in UTC, displayed in user's local timezone
- Local SQLite at `prisma/dev.db` (gitignored); Turso HTTP API in production
- Interview prep notes support Markdown
- Passwords hashed with bcryptjs (10 salt rounds) — never store plaintext
- API routes validate auth on every request via `getServerSession`
- Use server components by default, client components only for interactivity
- Dual DB mode: `better-sqlite3` locally, Turso HTTP API in production (see `src/lib/db.ts`)
- Rate limiting: 5 login attempts per IP per 15 minutes

## Security

- Multi-user auth with bcrypt-hashed passwords
- JWT sessions via NextAuth with secure HTTP-only cookies
- Security headers: CSP, X-Frame-Options, X-Content-Type-Options, Permissions-Policy
- Rate limiting on auth endpoints
- All API routes require authenticated session
- Environment variables for all secrets (never committed)

## Multi-Agent Workflow

This repo is worked on by multiple agents and devices:

### Agents
- **You (Claude Code)** — runs interactively on the owner's laptop or via SSH to the Mac Mini. Uses Opus via Max subscription. The owner supervises directly.
- **Constable (OpenClaw)** — an always-on autonomous agent running on a dedicated Mac Mini. Uses Sonnet by default, Opus on demand. Receives tasks via Telegram. Pushes code via the GitHub API.

### Branch Rules
- **Claude Code (supervised)**: Can push directly to master — the owner is reviewing in real time
- **Constable (autonomous)**: NEVER pushes to master. Always uses `agent/<feature-name>` branches. The owner reviews and merges via Pull Request.
- Cursor Bugbot runs automated reviews on every PR

### Before Starting Work
- Always `git pull origin master` first
- Check for open PRs and recent `agent/*` branches to avoid conflicts with Constable
- If Constable has a branch touching the same files, coordinate with the owner

### Deployment
- Railway auto-deploys from `master`
- Pushing or merging to master = going live
- Prisma migrations need to run on deploy (`prisma migrate deploy`)
- Raw SQL setup script (`scripts/setup-db.ts`) must stay in sync with Prisma schema

### AI Features
- `src/lib/ai.ts` — tiered AI router (local/sonnet/opus) with Ollama fallback
- Tier selection is always server-side, never from client input
- Existing AI routes: /api/ai-prep, /api/ai-followup, /api/parse-jd, /api/parse-screenshots
