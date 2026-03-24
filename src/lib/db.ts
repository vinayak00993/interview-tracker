/**
 * Database access layer — dual mode:
 * - Local dev: better-sqlite3 (synchronous, file-based)
 * - Production (Turso): @libsql/client (async, remote)
 *
 * All exported functions are async regardless of backend.
 */

const IS_TURSO = !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);

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

// ── Unified query interface ──

interface QueryResult {
  rows: Record<string, unknown>[];
}

interface DbBackend {
  execute(sql: string, args?: unknown[]): Promise<QueryResult>;
}

// ── better-sqlite3 backend (local dev) ──

function createLocalBackend(): DbBackend {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Database = require("better-sqlite3");
  const path = require("path");
  const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
  const sqliteDb = new Database(dbPath);
  sqliteDb.pragma("journal_mode = WAL");
  sqliteDb.pragma("foreign_keys = ON");

  return {
    async execute(sql: string, args?: unknown[]): Promise<QueryResult> {
      const trimmed = sql.trim().toUpperCase();
      if (trimmed.startsWith("SELECT") || trimmed.startsWith("WITH")) {
        const rows = args ? sqliteDb.prepare(sql).all(...args) : sqliteDb.prepare(sql).all();
        return { rows };
      } else {
        args ? sqliteDb.prepare(sql).run(...args) : sqliteDb.prepare(sql).run();
        return { rows: [] };
      }
    },
  };
}

// ── Turso HTTP backend (production) ──
// Uses Turso's HTTP API directly via Node.js native https module.
// This avoids cross-fetch/node-fetch header validation issues with JWT tokens.

function createTursoBackend(): DbBackend {
  const https = require("https");
  const tursoUrl = process.env.TURSO_DATABASE_URL!.replace("libsql://", "https://");
  const authToken = (process.env.TURSO_AUTH_TOKEN || "").trim();

  function tursoRequest(stmts: Array<{ sql: string; args?: unknown[] }>): Promise<any> {
    const requests = stmts.map((s) => ({
      type: "execute" as const,
      stmt: {
        sql: s.sql,
        args: (s.args || []).map((a) => {
          if (a === null || a === undefined) return { type: "null" };
          if (typeof a === "number") return { type: "integer", value: String(a) };
          return { type: "text", value: String(a) };
        }),
      },
    }));
    requests.push({ type: "close" } as any);

    const body = JSON.stringify({ requests });
    return new Promise((resolve, reject) => {
      const url = new URL(tursoUrl + "/v3/pipeline");
      const req = https.request(
        {
          hostname: url.hostname,
          port: 443,
          path: url.pathname,
          method: "POST",
          headers: {
            "Authorization": "Bearer " + authToken,
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body),
          },
        },
        (res: any) => {
          let data = "";
          res.on("data", (c: string) => (data += c));
          res.on("end", () => {
            try {
              const parsed = JSON.parse(data);
              resolve(parsed);
            } catch (e) {
              reject(new Error("Failed to parse Turso response: " + data.slice(0, 200)));
            }
          });
        }
      );
      req.on("error", reject);
      req.write(body);
      req.end();
    });
  }

  return {
    async execute(sql: string, args?: unknown[]): Promise<QueryResult> {
      const response = await tursoRequest([{ sql, args }]);
      const result = response.results?.[0];
      if (result?.type === "error") {
        throw new Error("Turso query error: " + result.error?.message);
      }
      // Convert Turso column-based response to row objects
      const execResult = result?.response?.result;
      if (!execResult) return { rows: [] };

      const cols = execResult.cols?.map((c: any) => c.name) || [];
      const rows = (execResult.rows || []).map((row: any[]) => {
        const obj: Record<string, unknown> = {};
        row.forEach((cell: any, i: number) => {
          if (cell.type === "null") obj[cols[i]] = null;
          else if (cell.type === "integer") obj[cols[i]] = Number(cell.value);
          else obj[cols[i]] = cell.value;
        });
        return obj;
      });
      return { rows };
    },
  };
}

// ── Singleton ──

const globalForDb = globalThis as unknown as { dbBackend: DbBackend | undefined };

function getBackend(): DbBackend {
  if (globalForDb.dbBackend) return globalForDb.dbBackend;
  const backend = IS_TURSO ? createTursoBackend() : createLocalBackend();
  if (process.env.NODE_ENV !== "production") globalForDb.dbBackend = backend;
  return backend;
}

export const db = getBackend();

// ── Helpers ──

function rowToObj<T>(row: Record<string, unknown> | undefined): T | undefined {
  if (!row) return undefined;
  if ("remote" in row) (row as any).remote = Boolean(row.remote);
  return row as unknown as T;
}

// ── User queries ──

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const result = await db.execute("SELECT * FROM User WHERE email = ?", [email]);
  return rowToObj<User>(result.rows[0]);
}

// ── Opportunity queries ──

export async function findOpportunities(userId: string) {
  const result = await db.execute(
    "SELECT * FROM Opportunity WHERE userId = ? ORDER BY updatedAt DESC",
    [userId]
  );
  const opps = result.rows;

  const enriched = [];
  for (const opp of opps) {
    const countResult = await db.execute(
      "SELECT COUNT(*) as count FROM Interview WHERE opportunityId = ?",
      [opp.id as string]
    );
    const interviewCount = Number(countResult.rows[0]?.count ?? 0);
    enriched.push({ ...rowToObj<Opportunity>(opp)!, _count: { interviews: interviewCount } });
  }
  return enriched;
}

export async function findOpportunityById(id: string, userId: string) {
  const oppResult = await db.execute(
    "SELECT * FROM Opportunity WHERE id = ? AND userId = ?",
    [id, userId]
  );
  const opp = oppResult.rows[0];
  if (!opp) return null;

  const interviewsResult = await db.execute(
    "SELECT * FROM Interview WHERE opportunityId = ? ORDER BY roundNumber ASC, dateTime ASC",
    [id]
  );

  const contactsResult = await db.execute(
    `SELECT oc.id as ocId, oc.role as ocRole, c.* FROM OpportunityContact oc
     JOIN Contact c ON c.id = oc.contactId
     WHERE oc.opportunityId = ?`,
    [id]
  );
  const opportunityContacts = contactsResult.rows.map((row: any) => ({
    id: row.ocId,
    role: row.ocRole,
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

  const activitiesResult = await db.execute(
    "SELECT * FROM Activity WHERE opportunityId = ? ORDER BY date DESC LIMIT 20",
    [id]
  );

  const docsResult = await db.execute(
    `SELECT od.id, od.sentAt, d.id as docId, d.type, d.name, d.version
     FROM OpportunityDocument od
     JOIN Document d ON d.id = od.documentId
     WHERE od.opportunityId = ?`,
    [id]
  );
  const documentsSent = docsResult.rows.map((row: any) => ({
    id: row.id,
    sentAt: row.sentAt,
    document: { id: row.docId, type: row.type, name: row.name, version: row.version },
  }));

  return {
    ...rowToObj<Opportunity>(opp)!,
    interviews: interviewsResult.rows as unknown as Interview[],
    opportunityContacts,
    activities: activitiesResult.rows as unknown as Activity[],
    documentsSent,
  };
}

export async function createOpportunity(userId: string, data: Partial<Opportunity>): Promise<Opportunity> {
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO Opportunity (id, userId, company, role, jdLink, compMin, compMax, location, remote, fitScore, priority, tier, status, appliedDate, source, notes, prosConsNotes, keyGaps, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [
      id, userId, data.company!, data.role!,
      data.jdLink ?? null, data.compMin ?? null, data.compMax ?? null,
      data.location ?? null, data.remote ? 1 : 0, data.fitScore ?? null,
      data.priority ?? "medium", data.tier ?? null, data.status ?? "saved",
      data.appliedDate ?? null, data.source ?? null, data.notes ?? null,
      data.prosConsNotes ?? null, data.keyGaps ?? null,
    ]
  );
  const result = await db.execute("SELECT * FROM Opportunity WHERE id = ?", [id]);
  return result.rows[0] as unknown as Opportunity;
}

export async function updateOpportunity(id: string, userId: string, data: Partial<Opportunity>) {
  const existing = await db.execute(
    "SELECT id FROM Opportunity WHERE id = ? AND userId = ?",
    [id, userId]
  );
  if (!existing.rows.length) return null;

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

  if (fields.length === 0) {
    const result = await db.execute("SELECT * FROM Opportunity WHERE id = ?", [id]);
    return rowToObj(result.rows[0]);
  }

  fields.push("updatedAt = datetime('now')");
  values.push(id);
  await db.execute(`UPDATE Opportunity SET ${fields.join(", ")} WHERE id = ?`, values);
  const result = await db.execute("SELECT * FROM Opportunity WHERE id = ?", [id]);
  return rowToObj(result.rows[0]);
}

export async function updateOpportunityStatus(id: string, userId: string, status: string) {
  const existingResult = await db.execute(
    "SELECT * FROM Opportunity WHERE id = ? AND userId = ?",
    [id, userId]
  );
  const existing = existingResult.rows[0] as unknown as Opportunity | undefined;
  if (!existing) return null;

  const updates: string[] = ["status = ?", "updatedAt = datetime('now')"];
  const values: any[] = [status];

  if (status === "applied" && !existing.appliedDate) {
    updates.push("appliedDate = datetime('now')");
  }

  values.push(id);
  await db.execute(`UPDATE Opportunity SET ${updates.join(", ")} WHERE id = ?`, values);
  const result = await db.execute("SELECT * FROM Opportunity WHERE id = ?", [id]);
  return rowToObj(result.rows[0]);
}

export async function deleteOpportunity(id: string, userId: string): Promise<boolean> {
  const existing = await db.execute(
    "SELECT id FROM Opportunity WHERE id = ? AND userId = ?",
    [id, userId]
  );
  if (!existing.rows.length) return false;
  await db.execute("DELETE FROM Opportunity WHERE id = ?", [id]);
  return true;
}

// ── Interview queries ──

export async function findUpcomingInterviews(userId: string, limit = 5) {
  const result = await db.execute(
    `SELECT i.*, o.company, o.role
     FROM Interview i
     JOIN Opportunity o ON o.id = i.opportunityId
     WHERE o.userId = ? AND i.status = 'scheduled' AND i.dateTime >= datetime('now')
     ORDER BY i.dateTime ASC
     LIMIT ?`,
    [userId, limit]
  );
  return result.rows.map((row: any) => ({
    ...row,
    opportunity: { company: row.company, role: row.role },
  }));
}

export async function createInterview(data: any): Promise<Interview> {
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO Interview (id, opportunityId, round, roundNumber, dateTime, durationMin, format, interviewerName, interviewerTitle, interviewerLinkedIn, prepNotes, debriefNotes, questionsAsked, questionsToAsk, status, sentiment, nextSteps, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [
      id, data.opportunityId, data.round, data.roundNumber ?? 1,
      data.dateTime ?? null, data.durationMin ?? null, data.format ?? "video",
      data.interviewerName ?? null, data.interviewerTitle ?? null,
      data.interviewerLinkedIn ?? null, data.prepNotes ?? null,
      data.debriefNotes ?? null, data.questionsAsked ?? null,
      data.questionsToAsk ?? null, data.status ?? "scheduled",
      data.sentiment ?? null, data.nextSteps ?? null,
    ]
  );
  const result = await db.execute("SELECT * FROM Interview WHERE id = ?", [id]);
  return result.rows[0] as unknown as Interview;
}

export async function updateInterview(id: string, userId: string, data: any) {
  const existing = await db.execute(
    `SELECT i.id FROM Interview i
     JOIN Opportunity o ON o.id = i.opportunityId
     WHERE i.id = ? AND o.userId = ?`,
    [id, userId]
  );
  if (!existing.rows.length) return null;

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

  if (fields.length === 0) {
    const result = await db.execute("SELECT * FROM Interview WHERE id = ?", [id]);
    return result.rows[0];
  }

  fields.push("updatedAt = datetime('now')");
  values.push(id);
  await db.execute(`UPDATE Interview SET ${fields.join(", ")} WHERE id = ?`, values);
  const result = await db.execute("SELECT * FROM Interview WHERE id = ?", [id]);
  return result.rows[0];
}

export async function deleteInterview(id: string, userId: string): Promise<boolean> {
  const existing = await db.execute(
    `SELECT i.id FROM Interview i
     JOIN Opportunity o ON o.id = i.opportunityId
     WHERE i.id = ? AND o.userId = ?`,
    [id, userId]
  );
  if (!existing.rows.length) return false;
  await db.execute("DELETE FROM Interview WHERE id = ?", [id]);
  return true;
}

// ── Activity queries ──

export async function findRecentActivities(userId: string, limit = 10) {
  const result = await db.execute(
    `SELECT a.*, o.company, o.role
     FROM Activity a
     LEFT JOIN Opportunity o ON o.id = a.opportunityId
     WHERE a.userId = ?
     ORDER BY a.date DESC
     LIMIT ?`,
    [userId, limit]
  );
  return result.rows.map((row: any) => ({
    ...row,
    opportunity: row.company ? { company: row.company, role: row.role } : null,
  }));
}
