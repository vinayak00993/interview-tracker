import https from "https";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const TURSO_URL = "https://interview-tracker-vinayak00993.aws-us-west-2.turso.io";
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

function cuid() {
  return crypto.randomBytes(16).toString("hex").slice(0, 25);
}

async function pipeline(stmts) {
  const requests = stmts.map((s) => ({
    type: "execute",
    stmt:
      typeof s === "string"
        ? { sql: s }
        : {
            sql: s.sql,
            args: (s.args || []).map((a) => {
              if (a === null) return { type: "null" };
              if (typeof a === "number")
                return { type: "integer", value: String(a) };
              return { type: "text", value: String(a) };
            }),
          },
  }));
  requests.push({ type: "close" });

  const body = JSON.stringify({ requests });
  return new Promise((resolve, reject) => {
    const req = https.request(
      TURSO_URL + "/v3/pipeline",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + TURSO_TOKEN,
          "Content-Type": "application/json",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          const parsed = JSON.parse(data);
          const errors = parsed.results?.filter((r) => r.type === "error");
          if (errors?.length) {
            console.error("Errors:", JSON.stringify(errors, null, 2));
            reject(new Error("Pipeline errors"));
          } else {
            resolve(parsed);
          }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  if (!TURSO_TOKEN) {
    console.error("Set TURSO_AUTH_TOKEN env var");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash("changeme123", 12);
  const userId = cuid();
  const sukhId = cuid();
  const elonaId = cuid();
  const christinaId = cuid();
  const rippleId = cuid();
  const anthropicBDId = cuid();
  const anthropicGTPId = cuid();
  const anthropicSPDId = cuid();
  const openaiDealId = cuid();
  const openaiIndiaId = cuid();

  const contactSql =
    "INSERT INTO Contact (id, userId, name, title, company, email, phone, linkedIn, type, warmth, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))";
  const oppSql =
    "INSERT INTO Opportunity (id, userId, company, role, jdLink, compMin, compMax, location, remote, fitScore, priority, tier, status, appliedDate, source, notes, keyGaps, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))";
  const actSql =
    "INSERT INTO Activity (id, userId, opportunityId, type, description, date, createdAt) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))";

  // Clean existing data first
  console.log("Cleaning existing data...");
  await pipeline([
    "DELETE FROM OpportunityDocument",
    "DELETE FROM OpportunityContact",
    "DELETE FROM Activity",
    "DELETE FROM Interview",
    "DELETE FROM Document",
    "DELETE FROM Opportunity",
    "DELETE FROM Contact",
    "DELETE FROM User",
  ]);
  console.log("  Cleaned");

  console.log("Seeding user and contacts...");
  await pipeline([
    {
      sql: "INSERT INTO User (id, email, passwordHash, name, createdAt, updatedAt) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))",
      args: [userId, "vinayak009@gmail.com", passwordHash, "Vinayak Rao"],
    },
    {
      sql: contactSql,
      args: [sukhId, userId, "Sukh Jhangri", "Sr. Recruitment Consultant", "Metrics Recruitment", "sukh@metricsrecruitment.com", "1.206.539.1342", "https://www.linkedin.com/in/sukh-jhangri", "recruiter", "hot", "External recruiter managing the Ripple Director of Ecosystem search."],
    },
    {
      sql: contactSql,
      args: [elonaId, userId, "Elona Kokoneshi", "Talent Team", "Ripple", null, null, "https://www.linkedin.com/in/elona-kokoneshi-80a58a22/", "recruiter", "warm", "Internal Ripple recruiter."],
    },
    {
      sql: contactSql,
      args: [christinaId, userId, "Christina Chan", "Senior Director of Ecosystem Growth", "Ripple", null, null, "https://www.linkedin.com/in/christinabchan/", "hiring_manager", "cold", "Direct manager for Director of Ecosystem role."],
    },
  ]);
  console.log("  User and contacts created");

  console.log("Seeding opportunities...");
  await pipeline([
    { sql: oppSql, args: [rippleId, userId, "Ripple", "Director of Ecosystem", "https://ripple.com/careers/all-jobs/job/7585978/", 200, 300, "San Francisco, CA", 0, 80, "high", 1, "interviewing", "2026-03-15", "recruiter", "Ripple Director of Ecosystem role.", "Need governance examples."] },
    { sql: oppSql, args: [anthropicBDId, userId, "Anthropic", "BD, Strategic Technology Partnerships", "https://job-boards.greenhouse.io/anthropic/jobs/5016875008", 250, 400, "San Francisco, CA", 0, 85, "high", 1, "saved", null, "direct", "Strong fit for deal structuring.", "AI/ML familiarity gap."] },
    { sql: oppSql, args: [anthropicGTPId, userId, "Anthropic", "Global Technology Partner Lead", "https://anthropic.com/careers/jobs/5043437008", 250, 400, "San Francisco, CA", 0, 78, "medium", 1, "saved", null, "direct", "Technology partnerships role.", null] },
    { sql: oppSql, args: [anthropicSPDId, userId, "Anthropic", "Strategic Partner Development, Product Partnerships", "https://www.anthropic.com/careers/jobs/5042144008", 200, 350, "San Francisco, CA", 0, 72, "medium", 2, "saved", null, "direct", "Product-focused partnerships.", null] },
    { sql: oppSql, args: [openaiDealId, userId, "OpenAI", "Deal Lead, Special Situations", null, 370, 500, "San Francisco, CA", 0, 90, "high", 1, "saved", null, "direct", "Strongest overall match.", "Domain experience gap."] },
    { sql: oppSql, args: [openaiIndiaId, userId, "OpenAI", "Product Partnerships Lead, India", "https://openai.com/careers/product-partnerships-lead-india-india-remote/", 200, 350, "India (Remote)", 1, 82, "medium", 1, "saved", null, "direct", "Strong India experience match.", null] },
  ]);
  console.log("  Opportunities created");

  console.log("Seeding interviews, contact links, docs...");
  await pipeline([
    {
      sql: "INSERT INTO Interview (id, opportunityId, round, roundNumber, dateTime, durationMin, format, interviewerName, interviewerTitle, interviewerLinkedIn, prepNotes, questionsToAsk, status, sentiment, nextSteps, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
      args: [cuid(), rippleId, "Recruiter Screen", 1, "2026-03-20T17:00:00.000Z", 30, "video", "Elona Kokoneshi", "Talent Team", "https://www.linkedin.com/in/elona-kokoneshi-80a58a22/", "Key prep notes for recruiter screen.", "Questions to ask about role.", "completed", null, "Awaiting feedback."],
    },
    { sql: "INSERT INTO OpportunityContact (id, opportunityId, contactId, role) VALUES (?, ?, ?, ?)", args: [cuid(), rippleId, sukhId, "recruiter"] },
    { sql: "INSERT INTO OpportunityContact (id, opportunityId, contactId, role) VALUES (?, ?, ?, ?)", args: [cuid(), rippleId, elonaId, "recruiter"] },
    { sql: "INSERT INTO OpportunityContact (id, opportunityId, contactId, role) VALUES (?, ?, ?, ?)", args: [cuid(), rippleId, christinaId, "hiring_manager"] },
    {
      sql: "INSERT INTO Document (id, userId, type, name, version, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
      args: [cuid(), userId, "resume", "Resume - AI Companies Target", "v3", "Optimized for AI companies."],
    },
  ]);
  console.log("  Interviews, links, docs created");

  console.log("Seeding activities...");
  await pipeline([
    { sql: actSql, args: [cuid(), userId, null, "researched", "Deep dive on target roles at Anthropic, OpenAI", "2026-03-09"] },
    { sql: actSql, args: [cuid(), userId, null, "researched", "Resume fully rewritten and optimized for AI company recruiters", "2026-03-09"] },
    { sql: actSql, args: [cuid(), userId, null, "researched", "LinkedIn headline, About section, and all job descriptions rewritten", "2026-03-09"] },
    { sql: actSql, args: [cuid(), userId, null, "researched", "Career toolkit artifact built with fit analysis and strategy", "2026-03-09"] },
    { sql: actSql, args: [cuid(), userId, rippleId, "applied", "Connected with Sukh Jhangri re: Ripple Director of Ecosystem role", "2026-03-15"] },
    { sql: actSql, args: [cuid(), userId, rippleId, "researched", "Received detailed prep notes from Sukh for Ripple recruiter screen", "2026-03-19"] },
    { sql: actSql, args: [cuid(), userId, rippleId, "interviewed", "Completed recruiter screen with Elona Kokoneshi at Ripple", "2026-03-20"] },
  ]);
  console.log("  Activities created");

  console.log("\nTurso database seeded!");
  console.log("Login: vinayak009@gmail.com / changeme123");
  console.log("Change your password after first login!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
