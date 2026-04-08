/**
 * Database setup script — works with both local SQLite and Turso.
 * Usage:
 *   npx tsx scripts/setup-db.ts          # local dev (file:./prisma/dev.db)
 *   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npx tsx scripts/setup-db.ts  # Turso
 */
import { createClient } from "@libsql/client/web";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "file:./prisma/dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({ url, authToken: authToken || undefined });

function cuid(): string {
  return crypto.randomBytes(16).toString("hex").slice(0, 25);
}

async function createSchema() {
  console.log("Creating schema...");

  const statements = [
    `CREATE TABLE IF NOT EXISTS User (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      name TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS Opportunity (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      jdLink TEXT,
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
      notes TEXT,
      prosConsNotes TEXT,
      keyGaps TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_opportunity_user_status ON Opportunity(userId, status)`,
    `CREATE INDEX IF NOT EXISTS idx_opportunity_user_company ON Opportunity(userId, company)`,
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
    `CREATE TABLE IF NOT EXISTS UserProfile (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL UNIQUE REFERENCES User(id) ON DELETE CASCADE,
      resumeText TEXT,
      linkedInAbout TEXT,
      linkedInUrl TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
  ];

  for (const sql of statements) {
    await db.execute(sql);
  }
  console.log("✓ Schema created");
}

async function seed() {
  console.log("Seeding data...");

  const passwordHash = await bcrypt.hash("demo12345678", 12);
  const userId = cuid();

  await db.execute({
    sql: `INSERT OR IGNORE INTO User (id, email, passwordHash, name, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
    args: [userId, "demo@example.com", passwordHash, "Demo User"],
  });

  const userResult = await db.execute({
    sql: "SELECT id FROM User WHERE email = ?",
    args: ["demo@example.com"],
  });
  const uid = userResult.rows[0]!.id as string;
  console.log("✓ Created user");

  // Contacts
  const sukhId = cuid(), elonaId = cuid(), christinaId = cuid();
  const contacts = [
    [sukhId, uid, "Sukh Jhangri", "Sr. Recruitment Consultant", "Metrics Recruitment", "recruiter@example.com", "1.555.555.1234", "https://www.linkedin.com/in/sukh-jhangri", "recruiter", "hot", "External recruiter managing the Ripple Director of Ecosystem search."],
    [elonaId, uid, "Elona Kokoneshi", "Talent Team", "Ripple", null, null, "https://www.linkedin.com/in/elona-kokoneshi-80a58a22/", "recruiter", "warm", "Internal Ripple recruiter."],
    [christinaId, uid, "Christina Chan", "Senior Director of Ecosystem Growth", "Ripple", null, null, "https://www.linkedin.com/in/christinabchan/", "hiring_manager", "cold", "Direct manager for Director of Ecosystem role."],
  ];
  for (const c of contacts) {
    await db.execute({
      sql: `INSERT INTO Contact (id, userId, name, title, company, email, phone, linkedIn, type, warmth, notes, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      args: c,
    });
  }
  console.log("✓ Created contacts");

  // Opportunities
  const rippleId = cuid(), anthropicBDId = cuid(), anthropicGTPId = cuid();
  const anthropicSPDId = cuid(), openaiDealId = cuid(), openaiIndiaId = cuid();

  const opps = [
    [rippleId, uid, "Ripple", "Director of Ecosystem", "https://ripple.com/careers/all-jobs/job/7585978/", 200, 300, "San Francisco, CA", 0, 80, "high", 1, "interviewing", "2026-03-15", "recruiter", "Ripple Director of Ecosystem role.", "Need governance examples."],
    [anthropicBDId, uid, "Anthropic", "BD, Strategic Technology Partnerships", "https://job-boards.greenhouse.io/anthropic/jobs/5016875008", 250, 400, "San Francisco, CA", 0, 85, "high", 1, "saved", null, "direct", "Strong fit for deal structuring.", "AI/ML familiarity gap."],
    [anthropicGTPId, uid, "Anthropic", "Global Technology Partner Lead", "https://anthropic.com/careers/jobs/5043437008", 250, 400, "San Francisco, CA", 0, 78, "medium", 1, "saved", null, "direct", "Technology partnerships role.", null],
    [anthropicSPDId, uid, "Anthropic", "Strategic Partner Development, Product Partnerships", "https://www.anthropic.com/careers/jobs/5042144008", 200, 350, "San Francisco, CA", 0, 72, "medium", 2, "saved", null, "direct", "Product-focused partnerships.", null],
    [openaiDealId, uid, "OpenAI", "Deal Lead, Special Situations", null, 370, 500, "San Francisco, CA", 0, 90, "high", 1, "saved", null, "direct", "Strongest overall match.", "Domain experience gap."],
    [openaiIndiaId, uid, "OpenAI", "Product Partnerships Lead, India", "https://openai.com/careers/product-partnerships-lead-india-india-remote/", 200, 350, "India (Remote)", 1, 82, "medium", 1, "saved", null, "direct", "Strong India experience match.", null],
  ];

  for (const o of opps) {
    await db.execute({
      sql: `INSERT INTO Opportunity (id, userId, company, role, jdLink, compMin, compMax, location, remote, fitScore, priority, tier, status, appliedDate, source, notes, keyGaps, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      args: o,
    });
  }
  console.log("✓ Created opportunities");

  // Interview
  await db.execute({
    sql: `INSERT INTO Interview (id, opportunityId, round, roundNumber, dateTime, durationMin, format, interviewerName, interviewerTitle, interviewerLinkedIn, prepNotes, questionsToAsk, status, sentiment, nextSteps, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    args: [cuid(), rippleId, "Recruiter Screen", 1, "2026-03-20T17:00:00.000Z", 30, "video", "Elona Kokoneshi", "Talent Team", "https://www.linkedin.com/in/elona-kokoneshi-80a58a22/", "Key prep notes for recruiter screen.", "Questions to ask about role.", "completed", null, "Awaiting feedback."],
  });
  console.log("✓ Created interviews");

  // Link contacts
  const links = [
    [cuid(), rippleId, sukhId, "recruiter"],
    [cuid(), rippleId, elonaId, "recruiter"],
    [cuid(), rippleId, christinaId, "hiring_manager"],
  ];
  for (const l of links) {
    await db.execute({
      sql: "INSERT INTO OpportunityContact (id, opportunityId, contactId, role) VALUES (?, ?, ?, ?)",
      args: l,
    });
  }
  console.log("✓ Linked contacts");

  // Documents
  await db.execute({
    sql: `INSERT INTO Document (id, userId, type, name, version, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    args: [cuid(), uid, "resume", "Resume — AI Companies Target", "v3", "Optimized for AI companies."],
  });
  console.log("✓ Created documents");

  // Activities
  const activities = [
    [cuid(), uid, null, "researched", "Deep dive on target roles at Anthropic, OpenAI", "2026-03-09"],
    [cuid(), uid, null, "researched", "Resume fully rewritten and optimized for AI company recruiters", "2026-03-09"],
    [cuid(), uid, null, "researched", "LinkedIn headline, About section, and all job descriptions rewritten", "2026-03-09"],
    [cuid(), uid, null, "researched", "Career toolkit artifact built with fit analysis and strategy", "2026-03-09"],
    [cuid(), uid, rippleId, "applied", "Connected with Sukh Jhangri re: Ripple Director of Ecosystem role", "2026-03-15"],
    [cuid(), uid, rippleId, "researched", "Received detailed prep notes from Sukh for Ripple recruiter screen", "2026-03-19"],
    [cuid(), uid, rippleId, "interviewed", "Completed recruiter screen with Elona Kokoneshi at Ripple", "2026-03-20"],
  ];
  for (const a of activities) {
    await db.execute({
      sql: `INSERT INTO Activity (id, userId, opportunityId, type, description, date, createdAt) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: a,
    });
  }
  console.log("✓ Created activities");

  console.log("\n🎉 Setup complete!");
  console.log("   Login: demo@example.com / demo12345678");
  console.log("   ⚠️  Change your password after first login!\n");
}

async function main() {
  console.log(`Database: ${url.startsWith("libsql") ? "Turso (remote)" : url}\n`);
  await createSchema();
  await seed();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
