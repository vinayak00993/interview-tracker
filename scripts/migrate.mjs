/**
 * Idempotent schema migration for local SQLite and Turso.
 *
 * Runs on every production start (see package.json "start") and on
 * `npm run db:setup`. Every statement is safe to re-run: tables use
 * CREATE TABLE IF NOT EXISTS, and new columns are added only when
 * PRAGMA table_info says they are missing.
 *
 * Keep this file in sync with prisma/schema.prisma.
 */
import { createClient } from "@libsql/client";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");

/** Resolve the database URL the same way src/lib/prisma.ts does. */
export function resolveDatabase(env = process.env) {
  const turso = env.TURSO_DATABASE_URL;
  if (turso) {
    return { url: turso, authToken: (env.TURSO_AUTH_TOKEN || "").trim() || undefined };
  }
  const raw = env.DATABASE_URL || "file:./dev.db";
  if (raw.startsWith("file:")) {
    const p = raw.slice("file:".length);
    // Prisma CLI resolves relative file paths against the prisma/ folder.
    const abs = path.isAbsolute(p) ? p : path.resolve(projectRoot, "prisma", p);
    return { url: `file:${abs}`, authToken: undefined };
  }
  return { url: raw, authToken: undefined };
}

const TABLES = [
  `CREATE TABLE IF NOT EXISTS User (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT,
    name TEXT,
    image TEXT,
    googleId TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_user_google_id ON User(googleId) WHERE googleId IS NOT NULL`,
  `CREATE TABLE IF NOT EXISTS UserProfile (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL UNIQUE REFERENCES User(id) ON DELETE CASCADE,
    resumeText TEXT,
    linkedInAbout TEXT,
    linkedInUrl TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS Opportunity (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    jdLink TEXT,
    jdText TEXT,
    website TEXT,
    compMin INTEGER,
    compMax INTEGER,
    location TEXT,
    remote INTEGER NOT NULL DEFAULT 0,
    fitScore INTEGER,
    totalScore REAL,
    priority TEXT NOT NULL DEFAULT 'medium',
    tier INTEGER,
    status TEXT NOT NULL DEFAULT 'saved',
    appliedDate TEXT,
    source TEXT,
    followUpAt TEXT,
    notes TEXT,
    prosConsNotes TEXT,
    keyGaps TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_opportunity_user_status ON Opportunity(userId, status)`,
  `CREATE INDEX IF NOT EXISTS idx_opportunity_user_company ON Opportunity(userId, company)`,
  `CREATE TABLE IF NOT EXISTS Offer (
    id TEXT PRIMARY KEY,
    opportunityId TEXT NOT NULL UNIQUE REFERENCES Opportunity(id) ON DELETE CASCADE,
    baseComp INTEGER,
    signOnBonus INTEGER,
    annualBonus INTEGER,
    bonusPercent REAL,
    equityType TEXT,
    equityValue INTEGER,
    equityShares INTEGER,
    vestYears INTEGER,
    vestCliff INTEGER,
    vestSchedule TEXT,
    ptoDays INTEGER,
    healthcare TEXT,
    remotePolicy TEXT,
    startDate TEXT,
    expiryDate TEXT,
    location TEXT,
    title TEXT,
    level TEXT,
    benefits TEXT,
    rawText TEXT,
    sourceType TEXT,
    aiSummary TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS Interview (
    id TEXT PRIMARY KEY,
    opportunityId TEXT NOT NULL REFERENCES Opportunity(id) ON DELETE CASCADE,
    round TEXT NOT NULL,
    roundNumber INTEGER NOT NULL DEFAULT 1,
    dateTime TEXT,
    durationMin INTEGER,
    format TEXT NOT NULL DEFAULT 'video',
    interviewerName TEXT,
    interviewerTitle TEXT,
    interviewerLinkedIn TEXT,
    prepNotes TEXT,
    debriefNotes TEXT,
    questionsAsked TEXT,
    questionsToAsk TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled',
    sentiment TEXT,
    nextSteps TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_interview_opportunity ON Interview(opportunityId)`,
  `CREATE TABLE IF NOT EXISTS InterviewPrep (
    id TEXT PRIMARY KEY,
    opportunityId TEXT NOT NULL REFERENCES Opportunity(id) ON DELETE CASCADE,
    interviewId TEXT REFERENCES Interview(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    model TEXT NOT NULL,
    promptVersion INTEGER NOT NULL DEFAULT 1,
    inputTokens INTEGER,
    outputTokens INTEGER,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_prep_opportunity ON InterviewPrep(opportunityId)`,
  `CREATE TABLE IF NOT EXISTS FollowUpDraft (
    id TEXT PRIMARY KEY,
    interviewId TEXT NOT NULL REFERENCES Interview(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    model TEXT NOT NULL,
    sentAt TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_followup_interview ON FollowUpDraft(interviewId)`,
  `CREATE TABLE IF NOT EXISTS Contact (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    title TEXT,
    company TEXT,
    email TEXT,
    phone TEXT,
    linkedIn TEXT,
    type TEXT NOT NULL DEFAULT 'other',
    warmth TEXT,
    notes TEXT,
    lastContactedAt TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_contact_user ON Contact(userId)`,
  `CREATE TABLE IF NOT EXISTS OpportunityContact (
    id TEXT PRIMARY KEY,
    opportunityId TEXT NOT NULL REFERENCES Opportunity(id) ON DELETE CASCADE,
    contactId TEXT NOT NULL REFERENCES Contact(id) ON DELETE CASCADE,
    role TEXT,
    UNIQUE(opportunityId, contactId)
  )`,
  `CREATE TABLE IF NOT EXISTS Activity (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
    opportunityId TEXT REFERENCES Opportunity(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    date TEXT NOT NULL DEFAULT (datetime('now')),
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_activity_user_date ON Activity(userId, date)`,
  `CREATE INDEX IF NOT EXISTS idx_activity_opportunity ON Activity(opportunityId)`,
  `CREATE TABLE IF NOT EXISTS Document (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    version TEXT,
    notes TEXT,
    filePath TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_document_user ON Document(userId)`,
  `CREATE TABLE IF NOT EXISTS OpportunityDocument (
    id TEXT PRIMARY KEY,
    opportunityId TEXT NOT NULL REFERENCES Opportunity(id) ON DELETE CASCADE,
    documentId TEXT NOT NULL REFERENCES Document(id) ON DELETE CASCADE,
    sentAt TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(opportunityId, documentId)
  )`,
  `CREATE TABLE IF NOT EXISTS RateLimit (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0,
    resetAt TEXT NOT NULL
  )`,
];

/** Columns added after a table first shipped: [table, column, definition]. */
const COLUMNS = [
  ["User", "image", "TEXT"],
  ["User", "googleId", "TEXT"],
  ["Opportunity", "website", "TEXT"],
  ["Opportunity", "jdText", "TEXT"],
  ["Opportunity", "followUpAt", "TEXT"],
];

export async function applyMigrations(client, log = () => {}) {
  for (const sql of TABLES) {
    await client.execute(sql);
  }
  for (const [table, column, definition] of COLUMNS) {
    const info = await client.execute(`PRAGMA table_info(${table})`);
    const exists = info.rows.some((row) => row.name === column);
    if (!exists) {
      await client.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
      log(`added ${table}.${column}`);
    }
  }
}

async function main() {
  const { url, authToken } = resolveDatabase();
  const client = createClient({ url, authToken });
  console.log(`[migrate] ${url.startsWith("libsql") || url.startsWith("https") ? "Turso (remote)" : url}`);
  await applyMigrations(client, (msg) => console.log(`[migrate] ${msg}`));
  console.log("[migrate] schema is up to date");
  client.close();
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((err) => {
    console.error("[migrate] failed:", err);
    process.exit(1);
  });
}
