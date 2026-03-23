import Database from "better-sqlite3";
import path from "path";

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof Database> | undefined;
};

function createDatabase() {
  const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

export const db = globalForDb.db ?? createDatabase();

if (process.env.NODE_ENV !== "production") globalForDb.db = db;

// ── Helpers ──

function toDate(d: string | null): Date | null {
  return d ? new Date(d) : null;
}

function rowToObj<T>(row: any): T {
  if (!row) return row;
  // Convert SQLite integer booleans to JS booleans
  if ("remote" in row) row.remote = Boolean(row.remote);
  return row as T;
}

// ── Types ──

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Opportunity {
  id: string;
  userId: string;
  company: string;
  role: string;
  jdLink: string | null;
  compMin: number | null;
  compMax: number | null;
  location: string | null;
  remote: boolean;
  fitScore: number | null;
  priority: string;
  tier: number | null;
  status: string;
  appliedDate: string | null;
  source: string | null;
  notes: string | null;
  prosConsNotes: string | null;
  keyGaps: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Interview {
  id: string;
  opportunityId: string;
  round: string;
  roundNumber: number;
  dateTime: string | null;
  durationMin: number | null;
  format: string;
  interviewerName: string | null;
  interviewerTitle: string | null;
  interviewerLinkedIn: string | null;
  prepNotes: string | null;
  debriefNotes: string | null;
  questionsAsked: string | null;
  questionsToAsk: string | null;
  status: string;
  sentiment: string | null;
  nextSteps: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  userId: string;
  name: string;
  title: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  linkedIn: string | null;
  type: string;
  warmth: string | null;
  notes: string | null;
  lastContactedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  userId: string;
  opportunityId: string | null;
  type: string;
  description: string;
  date: string;
  createdAt: string;
}

export interface Document {
  id: string;
  userId: string;
  type: string;
  name: string;
  version: string | null;
  notes: string | null;
  filePath: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── User queries ──

export function findUserByEmail(email: string): User | undefined {
  return db.prepare("SELECT * FROM User WHERE email = ?").get(email) as User | undefined;
}

// ── Opportunity queries ──

export function findOpportunities(userId: string) {
  const opps = db.prepare(`
    SELECT * FROM Opportunity WHERE userId = ? ORDER BY updatedAt DESC
  `).all(userId) as Opportunity[];

  return opps.map((opp) => {
    const interviewCount = (
      db.prepare("SELECT COUNT(*) as count FROM Interview WHERE opportunityId = ?").get(opp.id) as any
    ).count;
    return { ...rowToObj<Opportunity>(opp), _count: { interviews: interviewCount } };
  });
}

export function findOpportunityById(id: string, userId: string) {
  const opp = db.prepare("SELECT * FROM Opportunity WHERE id = ? AND userId = ?").get(id, userId) as
    | Opportunity
    | undefined;
  if (!opp) return null;

  const interviews = db
    .prepare("SELECT * FROM Interview WHERE opportunityId = ? ORDER BY roundNumber ASC, dateTime ASC")
    .all(id) as Interview[];

  const opportunityContacts = db
    .prepare(`
      SELECT oc.id, oc.role, c.* FROM OpportunityContact oc
      JOIN Contact c ON c.id = oc.contactId
      WHERE oc.opportunityId = ?
    `)
    .all(id)
    .map((row: any) => ({
      id: row.id,
      role: row.role,
      contact: {
        id: row.id,
        name: row.name,
        title: row.title,
        company: row.company,
        email: row.email,
        phone: row.phone,
        linkedIn: row.linkedIn,
        type: row.type,
        warmth: row.warmth,
        notes: row.notes,
      },
    }));

  const activities = db
    .prepare("SELECT * FROM Activity WHERE opportunityId = ? ORDER BY date DESC LIMIT 20")
    .all(id) as Activity[];

  const documentsSent = db
    .prepare(`
      SELECT od.id, od.sentAt, d.id as docId, d.type, d.name, d.version
      FROM OpportunityDocument od
      JOIN Document d ON d.id = od.documentId
      WHERE od.opportunityId = ?
    `)
    .all(id)
    .map((row: any) => ({
      id: row.id,
      sentAt: row.sentAt,
      document: { id: row.docId, type: row.type, name: row.name, version: row.version },
    }));

  return {
    ...rowToObj<Opportunity>(opp),
    interviews,
    opportunityContacts,
    activities,
    documentsSent,
  };
}

export function createOpportunity(userId: string, data: Partial<Opportunity>): Opportunity {
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO Opportunity (id, userId, company, role, jdLink, compMin, compMax, location, remote, fitScore, priority, tier, status, appliedDate, source, notes, prosConsNotes, keyGaps, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(
    id,
    userId,
    data.company,
    data.role,
    data.jdLink ?? null,
    data.compMin ?? null,
    data.compMax ?? null,
    data.location ?? null,
    data.remote ? 1 : 0,
    data.fitScore ?? null,
    data.priority ?? "medium",
    data.tier ?? null,
    data.status ?? "saved",
    data.appliedDate ?? null,
    data.source ?? null,
    data.notes ?? null,
    data.prosConsNotes ?? null,
    data.keyGaps ?? null
  );
  return db.prepare("SELECT * FROM Opportunity WHERE id = ?").get(id) as Opportunity;
}

export function updateOpportunity(id: string, userId: string, data: Partial<Opportunity>) {
  // Verify ownership
  const existing = db.prepare("SELECT id FROM Opportunity WHERE id = ? AND userId = ?").get(id, userId);
  if (!existing) return null;

  const fields: string[] = [];
  const values: any[] = [];

  const allowedFields = [
    "company", "role", "jdLink", "compMin", "compMax", "location", "remote",
    "fitScore", "priority", "tier", "status", "appliedDate", "source",
    "notes", "prosConsNotes", "keyGaps",
  ];

  for (const field of allowedFields) {
    if ((data as any)[field] !== undefined) {
      fields.push(`${field} = ?`);
      let val = (data as any)[field];
      if (field === "remote") val = val ? 1 : 0;
      if (field === "compMin" || field === "compMax" || field === "fitScore" || field === "tier") {
        val = val != null ? Number(val) : null;
      }
      values.push(val);
    }
  }

  if (fields.length === 0) return db.prepare("SELECT * FROM Opportunity WHERE id = ?").get(id);

  fields.push("updatedAt = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE Opportunity SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return rowToObj(db.prepare("SELECT * FROM Opportunity WHERE id = ?").get(id));
}

export function updateOpportunityStatus(id: string, userId: string, status: string) {
  const existing = db.prepare("SELECT * FROM Opportunity WHERE id = ? AND userId = ?").get(id, userId) as Opportunity | undefined;
  if (!existing) return null;

  const updates: string[] = ["status = ?", "updatedAt = datetime('now')"];
  const values: any[] = [status];

  // Auto-set appliedDate
  if (status === "applied" && !existing.appliedDate) {
    updates.push("appliedDate = datetime('now')");
  }

  values.push(id);
  db.prepare(`UPDATE Opportunity SET ${updates.join(", ")} WHERE id = ?`).run(...values);
  return rowToObj(db.prepare("SELECT * FROM Opportunity WHERE id = ?").get(id));
}

export function deleteOpportunity(id: string, userId: string): boolean {
  const existing = db.prepare("SELECT id FROM Opportunity WHERE id = ? AND userId = ?").get(id, userId);
  if (!existing) return false;
  db.prepare("DELETE FROM Opportunity WHERE id = ?").run(id);
  return true;
}

// ── Interview queries ──

export function findUpcomingInterviews(userId: string, limit = 5) {
  return db.prepare(`
    SELECT i.*, o.company, o.role
    FROM Interview i
    JOIN Opportunity o ON o.id = i.opportunityId
    WHERE o.userId = ? AND i.status = 'scheduled' AND i.dateTime >= datetime('now')
    ORDER BY i.dateTime ASC
    LIMIT ?
  `).all(userId, limit).map((row: any) => ({
    ...row,
    opportunity: { company: row.company, role: row.role },
  }));
}

export function createInterview(data: any): Interview {
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO Interview (id, opportunityId, round, roundNumber, dateTime, durationMin, format, interviewerName, interviewerTitle, interviewerLinkedIn, prepNotes, debriefNotes, questionsAsked, questionsToAsk, status, sentiment, nextSteps, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(
    id,
    data.opportunityId,
    data.round,
    data.roundNumber ?? 1,
    data.dateTime ?? null,
    data.durationMin ?? null,
    data.format ?? "video",
    data.interviewerName ?? null,
    data.interviewerTitle ?? null,
    data.interviewerLinkedIn ?? null,
    data.prepNotes ?? null,
    data.debriefNotes ?? null,
    data.questionsAsked ?? null,
    data.questionsToAsk ?? null,
    data.status ?? "scheduled",
    data.sentiment ?? null,
    data.nextSteps ?? null
  );
  return db.prepare("SELECT * FROM Interview WHERE id = ?").get(id) as Interview;
}

export function updateInterview(id: string, userId: string, data: any) {
  // Verify ownership via opportunity
  const existing = db.prepare(`
    SELECT i.id FROM Interview i
    JOIN Opportunity o ON o.id = i.opportunityId
    WHERE i.id = ? AND o.userId = ?
  `).get(id, userId);
  if (!existing) return null;

  const fields: string[] = [];
  const values: any[] = [];

  const allowedFields = [
    "round", "roundNumber", "dateTime", "durationMin", "format",
    "interviewerName", "interviewerTitle", "interviewerLinkedIn",
    "prepNotes", "debriefNotes", "questionsAsked", "questionsToAsk",
    "status", "sentiment", "nextSteps",
  ];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      fields.push(`${field} = ?`);
      let val = data[field];
      if (field === "roundNumber" || field === "durationMin") val = val != null ? Number(val) : null;
      values.push(val);
    }
  }

  if (fields.length === 0) return db.prepare("SELECT * FROM Interview WHERE id = ?").get(id);

  fields.push("updatedAt = datetime('now')");
  values.push(id);
  db.prepare(`UPDATE Interview SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return db.prepare("SELECT * FROM Interview WHERE id = ?").get(id);
}

export function deleteInterview(id: string, userId: string): boolean {
  const existing = db.prepare(`
    SELECT i.id FROM Interview i
    JOIN Opportunity o ON o.id = i.opportunityId
    WHERE i.id = ? AND o.userId = ?
  `).get(id, userId);
  if (!existing) return false;
  db.prepare("DELETE FROM Interview WHERE id = ?").run(id);
  return true;
}

// ── Activity queries ──

export function findRecentActivities(userId: string, limit = 10) {
  return db.prepare(`
    SELECT a.*, o.company, o.role
    FROM Activity a
    LEFT JOIN Opportunity o ON o.id = a.opportunityId
    WHERE a.userId = ?
    ORDER BY a.date DESC
    LIMIT ?
  `).all(userId, limit).map((row: any) => ({
    ...row,
    opportunity: row.company ? { company: row.company, role: row.role } : null,
  }));
}
