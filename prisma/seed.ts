import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import crypto from "crypto";

const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function cuid(): string {
  return crypto.randomBytes(16).toString("hex").slice(0, 25);
}

async function main() {
  // Create the admin user
  const passwordHash = await bcrypt.hash("changeme123", 12);
  const userId = cuid();

  db.prepare(`
    INSERT OR IGNORE INTO User (id, email, passwordHash, name, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(userId, "vinayak009@gmail.com", passwordHash, "Vinayak Rao");

  // Get user id (in case upsert found existing)
  const user = db.prepare(`SELECT id FROM User WHERE email = ?`).get("vinayak009@gmail.com") as any;
  const uid = user.id;

  console.log("✓ Created user: vinayak009@gmail.com");

  // --- CONTACTS ---
  const sukhId = cuid();
  const elonaId = cuid();
  const christinaId = cuid();

  const insertContact = db.prepare(`
    INSERT INTO Contact (id, userId, name, title, company, email, phone, linkedIn, type, warmth, notes, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  insertContact.run(sukhId, uid, "Sukh Jhangri", "Sr. Recruitment Consultant", "Metrics Recruitment", "sukh@metricsrecruitment.com", "1.206.539.1342", "https://www.linkedin.com/in/sukh-jhangri", "recruiter", "hot", "External recruiter managing the Ripple Director of Ecosystem search. Very responsive, provides detailed prep notes.");
  insertContact.run(elonaId, uid, "Elona Kokoneshi", "Talent Team", "Ripple", null, null, "https://www.linkedin.com/in/elona-kokoneshi-80a58a22/", "recruiter", "warm", "Internal Ripple recruiter managing the Director of Ecosystem search. First interview contact.");
  insertContact.run(christinaId, uid, "Christina Chan", "Senior Director of Ecosystem Growth", "Ripple", null, null, "https://www.linkedin.com/in/christinabchan/", "hiring_manager", "cold", "Would be the direct manager for the Director of Ecosystem role. Has spoken publicly about her vision for XRPL ecosystem growth.");

  console.log("✓ Created contacts");

  // --- OPPORTUNITIES ---
  const insertOpp = db.prepare(`
    INSERT INTO Opportunity (id, userId, company, role, jdLink, compMin, compMax, location, remote, fitScore, priority, tier, status, appliedDate, source, notes, keyGaps, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  const rippleId = cuid();
  insertOpp.run(rippleId, uid, "Ripple", "Director of Ecosystem", "https://ripple.com/careers/all-jobs/job/7585978/", 200, 300, "San Francisco, CA", 0, 80, "high", 1, "interviewing", "2026-03-15T00:00:00.000Z", "recruiter",
    "Ripple created the XRP Ledger but operates as a for-profit company. This role manages external partnerships (XRPL Foundation, XRPL Commons, regional hubs) and holds them accountable to outcomes. Reports to Christina Chan.\n\nKey cultural filter: hands-on execution mindset — they want an executor first, strategist second.",
    "Need strong governance example — holding external partner accountable without direct control. Think grant-funded entities, DAOs, foundations. Elona will probe on this specifically."
  );

  const anthropicBDId = cuid();
  insertOpp.run(anthropicBDId, uid, "Anthropic", "BD, Strategic Technology Partnerships", "https://job-boards.greenhouse.io/anthropic/jobs/5016875008", 250, 400, "San Francisco, CA", 0, 85, "high", 1, "saved", null, "direct",
    "JD explicitly asks for 'proven track record of structuring and closing innovative deals involving joint go-to-market, product partnerships, revenue sharing, marketplace models, co-innovation, or other non-standard commercial structures' — that is my entire career.\n\nOverall JD fit score: 85%\n- Deal structuring: 95%\n- Enterprise partnerships: 92%\n- Cross-functional leadership: 90%\n- Platform BD: 88%\n- AI/ML familiarity: 60% (gap)",
    "AI/ML familiarity scored at 60%. Need stronger framing — AI-adjacent experience (data platforms, infrastructure) but no direct AI/ML product experience. Cover letter must address this."
  );

  const anthropicGTPId = cuid();
  insertOpp.run(anthropicGTPId, uid, "Anthropic", "Global Technology Partner Lead", "https://anthropic.com/careers/jobs/5043437008", 250, 400, "San Francisco, CA", 0, 78, "medium", 1, "saved", null, "direct",
    "Owns and scales strategic partnerships with leading technology platforms — spanning product integration, co-selling, channel enablement, and joint GTM execution. The Google Cloud GCP partnership is a direct proof point. Strong fit but secondary to the BD role.",
    null
  );

  const anthropicSPDId = cuid();
  insertOpp.run(anthropicSPDId, uid, "Anthropic", "Strategic Partner Development, Product Partnerships", "https://www.anthropic.com/careers/jobs/5042144008", 200, 350, "San Francisco, CA", 0, 72, "medium", 2, "saved", null, "direct",
    "More product-focused than the BD role. Responsible for prospecting, negotiating, and closing deals with content providers. Cross-functional deal experience maps well but this is tertiary to the other two Anthropic roles.",
    null
  );

  const openaiDealId = cuid();
  insertOpp.run(openaiDealId, uid, "OpenAI", "Deal Lead, Special Situations", null, 370, 500, "San Francisco, CA", 0, 90, "high", 1, "saved", null, "direct",
    "STRONGEST overall match. Role is about inventing new commercial models in ambiguous environments where no playbook exists. Directly maps to 0-to-1 deal structuring career.\n\nKey proof points: Reliance Jio (non-standard multi-year enterprise deal), Shelby/Jump Trading (new platform from scratch), GCP Marketplace (hyperscaler partnership).\n\nComp: $370K+ base + equity — highest comp of all target roles.",
    "JD calls for domain experience in financial services, life sciences, semiconductors, or energy. My background is tech platforms/consumer infra. Cover letter must address this directly — the deal architecture methodology transfers across domains."
  );

  const openaiIndiaId = cuid();
  insertOpp.run(openaiIndiaId, uid, "OpenAI", "Product Partnerships Lead, India", "https://openai.com/careers/product-partnerships-lead-india-india-remote/", 200, 350, "India (Remote)", 1, 82, "medium", 1, "saved", null, "direct",
    "Strong match given Reliance Jio/India experience. Role is about structuring, negotiating, and managing complex partnership agreements from inception through launch and scale across India — almost literally what I did at Aptos with Jio.",
    null
  );

  console.log("✓ Created opportunities");

  // --- INTERVIEWS (Ripple) ---
  const interviewId = cuid();
  db.prepare(`
    INSERT INTO Interview (id, opportunityId, round, roundNumber, dateTime, durationMin, format, interviewerName, interviewerTitle, interviewerLinkedIn, prepNotes, questionsToAsk, status, sentiment, nextSteps, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(
    interviewId, rippleId, "Recruiter Screen", 1, "2026-03-20T17:00:00.000Z", 30, "video",
    "Elona Kokoneshi", "Talent Team", "https://www.linkedin.com/in/elona-kokoneshi-80a58a22/",
    "## Key Questions to Expect\n\n1. **Tell me about one example of how you grew a DeFi ecosystem.**\n   - Think AMMs, DEXs, stablecoins, incentives, liquidity behavior\n   - Need a concrete example with measurable traction/adoption\n\n2. **Tell me about one especially complicated partnership.**\n   - Multi-stakeholder, cross-border, governance-heavy\n   - Speak to actual stakeholders, constraints, tradeoffs, end result\n\n## Other Areas\n- Career story and why this role now\n- Hands-on work style (cultural filter — executor first, strategist second)\n- What I'm looking for and why Ripple resonates\n\n## Governance Example\nElona will probe on Web3 governance. Prepare: holding an external partner accountable without direct control — grant-funded entities, DAOs, foundations, regional hubs. Drive accountability through influence and incentive design.",
    "- What does success look like for this role in the first 6 months?\n- How does the team think about balancing Ripple's interests with the independence of the XRPL Foundation and regional hubs?\n- What's the biggest challenge the ecosystem team is facing right now?",
    "completed", null, "Awaiting feedback from Elona. Sukh will relay next steps."
  );

  console.log("✓ Created interviews");

  // --- LINK CONTACTS TO OPPORTUNITIES ---
  const insertOppContact = db.prepare(`
    INSERT INTO OpportunityContact (id, opportunityId, contactId, role)
    VALUES (?, ?, ?, ?)
  `);

  insertOppContact.run(cuid(), rippleId, sukhId, "recruiter");
  insertOppContact.run(cuid(), rippleId, elonaId, "recruiter");
  insertOppContact.run(cuid(), rippleId, christinaId, "hiring_manager");

  console.log("✓ Linked contacts to opportunities");

  // --- DOCUMENTS ---
  const insertDoc = db.prepare(`
    INSERT INTO Document (id, userId, type, name, version, notes, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  insertDoc.run(cuid(), uid, "resume", "Resume — AI Companies Target", "v3", "Fully rewritten resume optimized for AI company recruiters. Aptos reframed as 'enterprise data and infrastructure platform' rather than blockchain. Two-page format.");
  insertDoc.run(cuid(), uid, "other", "Career Toolkit (React)", "v1", "Interactive React artifact with fit analysis, rewritten resume, LinkedIn copy, and application strategy. Can be rendered in any Claude conversation.");

  console.log("✓ Created documents");

  // --- ACTIVITIES ---
  const insertActivity = db.prepare(`
    INSERT INTO Activity (id, userId, opportunityId, type, description, date, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const activities = [
    { type: "researched", description: "Deep dive on target roles at Anthropic, OpenAI — ranked by fit", date: "2026-03-09T00:00:00.000Z", oppId: null },
    { type: "researched", description: "Resume fully rewritten and optimized for AI company recruiters", date: "2026-03-09T00:00:00.000Z", oppId: null },
    { type: "researched", description: "LinkedIn headline, About section, and all job descriptions rewritten", date: "2026-03-09T00:00:00.000Z", oppId: null },
    { type: "researched", description: "Career toolkit artifact built with fit analysis and strategy", date: "2026-03-09T00:00:00.000Z", oppId: null },
    { type: "applied", description: "Connected with Sukh Jhangri (Metrics Recruitment) re: Ripple Director of Ecosystem role", date: "2026-03-15T00:00:00.000Z", oppId: rippleId },
    { type: "researched", description: "Received detailed prep notes from Sukh for Ripple recruiter screen", date: "2026-03-19T00:00:00.000Z", oppId: rippleId },
    { type: "interviewed", description: "Completed recruiter screen with Elona Kokoneshi at Ripple", date: "2026-03-20T00:00:00.000Z", oppId: rippleId },
  ];

  for (const a of activities) {
    insertActivity.run(cuid(), uid, a.oppId, a.type, a.description, a.date);
  }

  console.log("✓ Created activity feed");
  console.log("\n🎉 Seed complete! Your pipeline is ready.");
  console.log("   Login: vinayak009@gmail.com / changeme123");
  console.log("   ⚠️  Change your password after first login!\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    db.close();
  });
