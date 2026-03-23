# Interview Tracker — Claude Code Project Guide

## Project Overview

A personal job search management platform for tracking opportunities, interviews, contacts, and application status across an active career transition. Built to be secure, single-user first, with a clean path to open-sourcing for others.

### Owner Context

This tool is being built by **Vinayak Rao**, a BD & Investments Lead at Aptos Labs, actively targeting a career transition into strategic partnerships/BD roles at AI-first companies (Anthropic, OpenAI, Ripple, etc.). The tracker needs to handle:

- Multiple simultaneous opportunities at different stages
- Interview prep notes and debrief logs per opportunity
- Recruiter and hiring manager contact tracking
- Timeline visualization of where each opportunity stands
- Quick-reference cards for upcoming interviews

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: SQLite via Prisma ORM (portable, no external DB setup)
- **Auth**: NextAuth.js with credentials provider (single-user initially, expandable)
- **Styling**: Tailwind CSS
- **Deployment**: Runs locally first, deployable to Vercel + Turso (SQLite cloud) later

## Data Model (Prisma schema in `/prisma/schema.prisma`)

### Core Entities

1. **Opportunity** — A role at a company (e.g., "Anthropic — BD, Strategic Technology Partnerships")
   - Fields: company, role title, JD link, comp range, location, fit score, status (saved/applied/interviewing/offer/rejected/withdrawn), priority tier, notes, created/updated timestamps
   
2. **Interview** — A specific interview event tied to an opportunity
   - Fields: round name (e.g., "Recruiter Screen", "Hiring Manager", "Panel"), date/time, interviewer name + title, format (phone/video/onsite), prep notes, debrief notes, status (scheduled/completed/cancelled), outcome sentiment (positive/neutral/negative)

3. **Contact** — People involved in the process (recruiters, hiring managers, referrals)
   - Fields: name, title, company, email, phone, LinkedIn URL, relationship type (recruiter/hiring_manager/referral/other), notes, last contacted date

4. **Activity** — Timeline of all actions taken
   - Fields: type (applied/emailed/interviewed/followed_up/researched/offer_received), description, opportunity link, date

5. **Document** — Track which materials were sent where
   - Fields: type (resume/cover_letter/portfolio/other), version name, file path or notes, which opportunities it was sent to

## Key Features to Build

### Phase 1 — Core Dashboard (MVP)
- Dashboard with pipeline view: opportunities grouped by status columns (Kanban-style)
- Opportunity detail page with interview timeline, contacts, and notes
- Quick-add forms for new opportunities and interviews
- Upcoming interviews widget (next 7 days)
- Search and filter across all opportunities

### Phase 2 — Intelligence Layer
- Interview prep mode: pulls in company research, JD analysis, and suggested talking points
- Follow-up reminders and cadence tracking
- Comp comparison across opportunities
- Status change history / audit trail

### Phase 3 — Open Source Ready
- Multi-user auth (email/password + OAuth)
- Data export (CSV, JSON)
- Customizable pipeline stages
- API endpoints for integrations
- Docker containerization

## Design Direction

The UI should feel like a premium personal tool — think Linear or Notion, not a generic CRUD app. Key principles:

- **Dark theme by default** with a clean, professional feel
- **Minimal chrome** — let the data breathe
- **Status colors**: Use a consistent palette (green = offer/positive, blue = active/interviewing, amber = pending/applied, gray = saved/paused, red = rejected)
- **Typography**: Clean sans-serif, good hierarchy
- **Dense but readable** — this is a power-user tool, not a marketing site

## File Structure

```
interview-tracker/
├── CLAUDE.md              ← You are here
├── README.md              ← Project readme
├── package.json           ← Dependencies
├── .env.example           ← Environment variables template
├── prisma/
│   └── schema.prisma      ← Database schema
├── src/
│   ├── app/               ← Next.js App Router pages
│   │   ├── layout.tsx     ← Root layout
│   │   ├── page.tsx       ← Landing/login redirect
│   │   ├── dashboard/     ← Main dashboard
│   │   ├── opportunities/ ← Opportunity detail pages
│   │   ├── login/         ← Auth page
│   │   └── api/           ← API routes
│   ├── components/        ← Reusable UI components
│   └── lib/               ← Utilities, DB client, auth config
└── public/                ← Static assets
```

## Commands

```bash
# Install dependencies
npm install

# Set up database
npx prisma generate
npx prisma db push

# Seed with sample data
npx prisma db seed

# Run development server
npm run dev
```

## Important Implementation Notes

- All dates should be stored in UTC and displayed in the user's local timezone
- The SQLite database file lives at `prisma/dev.db` — gitignored but portable
- Interview prep notes support Markdown
- The seed file includes Vinayak's actual current pipeline as starter data
- Passwords are hashed with bcrypt — never store plaintext
- API routes should validate auth on every request
- Use server components by default, client components only when needed for interactivity

## Security Considerations

- Single-user auth with hashed password
- No data leaves the local machine unless explicitly deployed
- SQLite DB is a single file — easy to backup, easy to encrypt
- Session tokens via NextAuth with secure HTTP-only cookies
- When open-sourcing: strip all personal data from seed files, use .env for all secrets
