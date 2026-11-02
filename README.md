# Interview Tracker

Prep smarter, debrief faster, land the role. A personal interview intelligence platform: a pipeline board for every opportunity, round-specific AI prep that learns from your debriefs, follow-up drafts, contact and document tracking, and offer comparison with an AI advisor.

## Features

- **Pipeline** — Kanban board across saved, applied, interviewing, offer, rejected, withdrawn; drag on desktop, swipe on phones
- **Add in seconds** — paste a job posting URL or screenshots and the fields fill themselves
- **Prep** — structured prep sheets per interview round built from your resume, the job description, and every earlier debrief; gaps carry forward until you close them
- **Debrief** — capture how a round went in two minutes, with the gaps you planned to address shown as reminders
- **Follow-ups** — streamed thank-you drafts per round, saved and marked sent
- **Contacts and documents** — recruiters and hiring managers per opportunity; which resume went where
- **Offers** — extract an offer letter into structured fields, compare side by side, ask the advisor
- **Reminders** — explicit follow-up dates and stale opportunities surface in the sidebar
- **Export** — CSV of the pipeline or full JSON of everything

## Tech Stack

- [Next.js 14](https://nextjs.org/) App Router, server actions
- [Prisma](https://www.prisma.io/) over [libsql](https://github.com/tursodatabase/libsql) (SQLite locally, [Turso](https://turso.tech/) in production)
- [NextAuth.js](https://next-auth.js.org/) (credentials + Google)
- [Claude](https://www.anthropic.com/) via `@anthropic-ai/sdk`
- [Tailwind CSS](https://tailwindcss.com/)
- [Vitest](https://vitest.dev/) + GitHub Actions

## Quick Start

```bash
npm install
cp .env.example .env     # set NEXTAUTH_SECRET; add ANTHROPIC_API_KEY for AI features
npm run db:setup         # creates prisma/dev.db and seeds a demo account
npm run dev
```

Open http://localhost:3000 and sign in as `demo@example.com` / `demo12345678`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run db:migrate` | Apply the idempotent schema migration (`scripts/migrate.mjs`) |
| `npm run db:seed` | Seed the demo account |
| `npm run db:reset` | Delete the local database, migrate, seed |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `next lint` |
| `npm test` | Vitest against a temporary SQLite file |
| `npm run build` | `prisma generate && next build` |

## Deployment

Set `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `ANTHROPIC_API_KEY`. `npm start` runs the migration before starting the server, so schema additions ship with the code.

## License

MIT
