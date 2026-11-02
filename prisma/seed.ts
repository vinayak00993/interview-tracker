/**
 * Seeds a demo account with a realistic pipeline. Safe to re-run: it
 * skips if the demo user already exists.
 *
 *   npm run db:setup   (migrate + seed)
 */
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "demo12345678";

function daysFromNow(days: number, hour = 17): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) {
    console.log(`Demo user ${DEMO_EMAIL} already exists, nothing to do.`);
    return;
  }

  const now = new Date().toISOString();
  const ts = { createdAt: now, updatedAt: now };
  const user = await prisma.user.create({
    data: { email: DEMO_EMAIL, passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10), name: "Demo User", ...ts },
  });
  const uid = user.id;

  await prisma.userProfile.create({
    data: {
      userId: uid,
      resumeText:
        "Partnerships and business development leader with twelve years structuring platform deals. Led a multi-year enterprise agreement with a national telecom, built a hyperscaler marketplace channel from zero to eight figures, and ran a 14-person partnerships team.",
      linkedInAbout: "I build the deals that turn platforms into ecosystems.",
      linkedInUrl: "https://www.linkedin.com/in/demo-user",
      ...ts,
    },
  });

  const [recruiter, talent, manager] = await Promise.all([
    prisma.contact.create({ data: { userId: uid, name: "Priya Natarajan", title: "Senior Recruiting Consultant", company: "Northstar Search", email: "priya@northstarsearch.example", type: "recruiter", warmth: "hot", notes: "External recruiter running the Ledgerline search. Fast and detailed.", ...ts } }),
    prisma.contact.create({ data: { userId: uid, name: "Marcus Oyelaran", title: "Talent Partner", company: "Ledgerline", type: "recruiter", warmth: "warm", notes: "Internal recruiter. First interview contact.", ...ts } }),
    prisma.contact.create({ data: { userId: uid, name: "Dana Whitfield", title: "VP Ecosystem", company: "Ledgerline", type: "hiring_manager", warmth: "cold", notes: "Would be the direct manager. Has spoken publicly about partner accountability.", ...ts } }),
  ]);

  const ledgerline = await prisma.opportunity.create({
    data: {
      userId: uid, company: "Ledgerline", role: "Director of Ecosystem", website: "https://ledgerline.example",
      compMin: 200, compMax: 300, location: "San Francisco, CA", fitScore: 80, priority: "high", tier: 1,
      status: "interviewing", appliedDate: daysFromNow(-12), source: "recruiter",
      notes: "Manages external partners (foundation, regional hubs) and holds them to outcomes. Cultural filter: executor first, strategist second.",
      keyGaps: "Need a strong governance example: holding an external partner accountable without direct control.",
      ...ts,
    },
  });
  const aurora = await prisma.opportunity.create({
    data: {
      userId: uid, company: "Aurora Labs", role: "Strategic Technology Partnerships", website: "https://auroralabs.example",
      compMin: 250, compMax: 400, location: "San Francisco, CA", fitScore: 85, priority: "high", tier: 1, status: "applied",
      appliedDate: daysFromNow(-4), source: "direct",
      notes: "JD asks for non-standard commercial structures: joint GTM, revenue share, marketplace models. That is the whole career.",
      keyGaps: "AI/ML product familiarity. Frame data platform and infrastructure work as adjacent.",
      ...ts,
    },
  });
  const meridian = await prisma.opportunity.create({
    data: {
      userId: uid, company: "Meridian", role: "Deal Lead, Special Situations", website: "https://meridian.example",
      compMin: 370, compMax: 500, location: "New York, NY", fitScore: 90, priority: "high", tier: 1, status: "saved", source: "direct",
      notes: "Strongest overall match. Inventing commercial models where no playbook exists.",
      keyGaps: "JD wants financial services or life sciences domain depth.",
      ...ts,
    },
  });
  const halcyon = await prisma.opportunity.create({
    data: {
      userId: uid, company: "Halcyon", role: "Head of Partnerships", website: "https://halcyon.example",
      compMin: 220, compMax: 320, location: "Remote", remote: true, fitScore: 78, priority: "medium", tier: 2, status: "saved", source: "job_board",
      followUpAt: daysFromNow(-1),
      ...ts,
    },
  });
  await prisma.opportunity.create({
    data: {
      userId: uid, company: "Quill", role: "Director, Alliances", website: "https://quill.example",
      compMin: 180, compMax: 260, location: "Austin, TX", fitScore: 60, priority: "low", tier: 3, status: "rejected", source: "job_board",
      notes: "Feedback: wanted more SaaS channel experience.",
      ...ts,
    },
  });

  await prisma.interview.create({
    data: {
      opportunityId: ledgerline.id, round: "Recruiter Screen", roundNumber: 1, dateTime: daysFromNow(-6), durationMin: 30, format: "video",
      interviewerName: "Marcus Oyelaran", interviewerTitle: "Talent Partner",
      prepNotes: "Expect: one example of growing an ecosystem, one complicated partnership. Hands-on work style is the cultural filter.",
      questionsToAsk: "What does success look like in the first six months?\nHow does the team balance company interests with partner independence?",
      debriefNotes: "Went well. Marcus pushed hard on governance: how I hold partners accountable without direct control. Used the regional hub example. He hinted the hiring manager will want a concrete operating cadence.",
      questionsAsked: "Tell me about a partner relationship that went sideways.\nHow do you decide what to fund?",
      status: "completed", sentiment: "positive", nextSteps: "Hiring manager round next week.",
      ...ts,
    },
  });
  await prisma.interview.create({
    data: {
      opportunityId: ledgerline.id, round: "Hiring Manager", roundNumber: 2, dateTime: daysFromNow(3), durationMin: 45, format: "video",
      interviewerName: "Dana Whitfield", interviewerTitle: "VP Ecosystem", status: "scheduled", ...ts,
    },
  });
  await prisma.interview.create({
    data: {
      opportunityId: aurora.id, round: "Recruiter Screen", roundNumber: 1, dateTime: daysFromNow(5, 18), durationMin: 30, format: "phone", status: "scheduled", ...ts,
    },
  });

  await prisma.opportunityContact.createMany({
    data: [
      { opportunityId: ledgerline.id, contactId: recruiter.id, role: "recruiter" },
      { opportunityId: ledgerline.id, contactId: talent.id, role: "recruiter" },
      { opportunityId: ledgerline.id, contactId: manager.id, role: "hiring_manager" },
    ],
  });

  const resume = await prisma.document.create({
    data: { userId: uid, type: "resume", name: "Resume, platform partnerships", version: "v3", notes: "Reframed infrastructure work for AI companies. Two pages.", ...ts },
  });
  await prisma.opportunityDocument.createMany({
    data: [
      { opportunityId: ledgerline.id, documentId: resume.id, sentAt: daysFromNow(-12) },
      { opportunityId: aurora.id, documentId: resume.id, sentAt: daysFromNow(-4) },
    ],
  });

  const activities: { opportunityId: string | null; type: string; description: string; date: string }[] = [
    { opportunityId: null, type: "researched", description: "Ranked target roles by fit and rewrote the resume for platform partnerships", date: daysFromNow(-14) },
    { opportunityId: ledgerline.id, type: "applied", description: "Introduced by Priya Natarajan for Director of Ecosystem", date: daysFromNow(-12) },
    { opportunityId: ledgerline.id, type: "interviewed", description: "Completed Recruiter Screen (positive)", date: daysFromNow(-6) },
    { opportunityId: aurora.id, type: "applied", description: "Applied with tailored resume", date: daysFromNow(-4) },
    { opportunityId: meridian.id, type: "note", description: "Added Meridian, Deal Lead, Special Situations to the pipeline", date: daysFromNow(-2) },
    { opportunityId: halcyon.id, type: "note", description: "Added Halcyon, Head of Partnerships to the pipeline", date: daysFromNow(-9) },
  ];
  for (const a of activities) {
    await prisma.activity.create({ data: { userId: uid, ...a, createdAt: now } });
  }

  console.log(`Seeded demo account.\n  Login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
