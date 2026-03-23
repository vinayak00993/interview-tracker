# Interview Tracker

A personal job search management platform for tracking opportunities, interviews, contacts, and application status.

Built for power users managing an active job search across multiple companies simultaneously.

## Features

- **Pipeline View** — Kanban-style board showing all opportunities by status
- **Interview Timeline** — Chronological view of all interviews per opportunity
- **Contact Management** — Track recruiters, hiring managers, and referrals
- **Prep & Debrief Notes** — Markdown-supported notes for each interview round
- **Activity Feed** — Full history of every action taken
- **Upcoming Interviews** — At-a-glance view of what's coming up

## Tech Stack

- [Next.js 14](https://nextjs.org/) — React framework with App Router
- [Prisma](https://www.prisma.io/) + SQLite — Type-safe ORM with portable database
- [NextAuth.js](https://next-auth.js.org/) — Authentication
- [Tailwind CSS](https://tailwindcss.com/) — Styling

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env

# 3. Set up the database
npx prisma generate
npx prisma db push

# 4. Seed with sample data (optional)
npx prisma db seed

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to get started.

## Environment Variables

See `.env.example` for all required variables. At minimum you need:

- `NEXTAUTH_SECRET` — A random string for session encryption
- `ADMIN_EMAIL` — Your login email
- `ADMIN_PASSWORD_HASH` — bcrypt hash of your password

## Database

SQLite is used by default — no external database setup required. The database file is stored at `prisma/dev.db` and is gitignored.

To reset the database:

```bash
npx prisma db push --force-reset
npx prisma db seed
```

## Deployment

For local use, just run `npm run dev`. For cloud deployment:

1. Swap SQLite for [Turso](https://turso.tech/) or Postgres via Prisma
2. Deploy to [Vercel](https://vercel.com/)
3. Set environment variables in the deployment dashboard

## License

MIT — see LICENSE for details.
