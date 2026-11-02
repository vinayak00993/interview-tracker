import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { createUser, verifyPassword, findUserByEmail, EmailExistsError } from "@/lib/data/users";
import {
  createOpportunity,
  listOpportunities,
  getOpportunity,
  updateOpportunity,
  updateOpportunityStatus,
  deleteOpportunity,
  findFollowUps,
  setFollowUp,
} from "@/lib/data/opportunities";
import { createInterview, updateInterview, listUpcomingInterviews, getInterview } from "@/lib/data/interviews";
import { createContact, attachContact, detachContact, listContacts, createContactForOpportunity } from "@/lib/data/contacts";
import { createDocument, markDocumentSent, listDocuments } from "@/lib/data/documents";
import { upsertOffer, listOffers, deleteOffer } from "@/lib/data/offers";
import { savePrep, listPreps, saveFollowUp, markFollowUpSent } from "@/lib/data/prep";
import { consumeRateLimit, resetRateLimit } from "@/lib/data/rate-limit";
import { upsertProfile, getProfile } from "@/lib/data/profile";
import { opportunityCreateSchema, interviewCreateSchema, contactCreateSchema, offerUpsertSchema } from "@/lib/validation";

let userId: string;
let otherUserId: string;

beforeAll(async () => {
  const user = await createUser("tester@example.com", "password123", "Tester");
  const other = await createUser("other@example.com", "password123", "Other");
  userId = user.id;
  otherUserId = other.id;
});

describe("users", () => {
  it("hashes passwords and rejects duplicate emails", async () => {
    const user = await findUserByEmail("TESTER@example.com");
    expect(user).not.toBeNull();
    expect(user!.passwordHash).not.toBe("password123");
    expect(await verifyPassword(user!, "password123")).toBe(true);
    expect(await verifyPassword(user!, "wrong")).toBe(false);
    await expect(createUser("tester@example.com", "password123", "Again")).rejects.toBeInstanceOf(EmailExistsError);
  });
});

describe("opportunities", () => {
  it("creates with validated input and counts interviews in one query", async () => {
    const input = opportunityCreateSchema.parse({ company: "Acme", role: "Head of BD", compMin: "150", compMax: "", remote: "on", source: "job board" });
    expect(input.compMax).toBeNull();
    expect(input.remote).toBe(true);
    expect(input.source).toBe("job_board");
    const created = await createOpportunity(userId, input);
    expect(created._count.interviews).toBe(0);
    const list = await listOpportunities(userId);
    expect(list.map((o) => o.id)).toContain(created.id);
    // The create logged an activity.
    const detail = await getOpportunity(created.id, userId);
    expect(detail!.activities.some((a) => a.type === "note")).toBe(true);
  });

  it("logs status changes and stamps appliedDate", async () => {
    const created = await createOpportunity(userId, opportunityCreateSchema.parse({ company: "Beta", role: "Director" }));
    const moved = await updateOpportunityStatus(created.id, userId, "applied");
    expect(moved!.status).toBe("applied");
    expect(moved!.appliedDate).toBeTruthy();
    const detail = await getOpportunity(created.id, userId);
    const change = detail!.activities.find((a) => a.type === "status_change");
    expect(change?.description).toBe("Moved from Saved to Applied");
  });

  it("is scoped to the owning user", async () => {
    const created = await createOpportunity(userId, opportunityCreateSchema.parse({ company: "Gamma", role: "Lead" }));
    expect(await getOpportunity(created.id, otherUserId)).toBeNull();
    expect(await updateOpportunity(created.id, otherUserId, { notes: "x" })).toBeNull();
    expect(await deleteOpportunity(created.id, otherUserId)).toBe(false);
    expect(await deleteOpportunity(created.id, userId)).toBe(true);
  });

  it("surfaces due reminders and stale active opportunities", async () => {
    const stale = await createOpportunity(userId, opportunityCreateSchema.parse({ company: "Stale Co", role: "Lead", status: "applied" }));
    const old = new Date(Date.now() - 10 * 86_400_000).toISOString();
    await prisma.activity.updateMany({ where: { opportunityId: stale.id }, data: { date: old } });
    await prisma.opportunity.update({ where: { id: stale.id }, data: { updatedAt: old } });

    const due = await createOpportunity(userId, opportunityCreateSchema.parse({ company: "Due Co", role: "Lead", status: "interviewing" }));
    await setFollowUp(due.id, userId, new Date(Date.now() - 3_600_000).toISOString());

    const fresh = await createOpportunity(userId, opportunityCreateSchema.parse({ company: "Fresh Co", role: "Lead", status: "applied" }));

    const items = await findFollowUps(userId);
    const byId = Object.fromEntries(items.map((i) => [i.id, i]));
    expect(byId[stale.id]?.reason).toBe("stale");
    expect(byId[due.id]?.reason).toBe("scheduled");
    expect(byId[fresh.id]).toBeUndefined();
  });
});

describe("interviews", () => {
  it("creates only for owned opportunities and logs completion", async () => {
    const opp = await createOpportunity(userId, opportunityCreateSchema.parse({ company: "Delta", role: "VP" }));
    const input = interviewCreateSchema.parse({ opportunityId: opp.id, round: "Screen", dateTime: new Date(Date.now() + 86_400_000).toISOString() });
    expect(await createInterview(otherUserId, input)).toBeNull();
    const interview = (await createInterview(userId, input))!;
    expect(interview.status).toBe("scheduled");

    const upcoming = await listUpcomingInterviews(userId);
    expect(upcoming.some((i) => i.id === interview.id)).toBe(true);
    expect(upcoming[0].opportunity.company).toBeTruthy();

    await updateInterview(interview.id, userId, { status: "completed", sentiment: "positive", debriefNotes: "Good" });
    const detail = await getOpportunity(opp.id, userId);
    expect(detail!.activities.some((a) => a.type === "interviewed")).toBe(true);
    expect(await getInterview(interview.id, otherUserId)).toBeNull();
  });
});

describe("contacts and documents", () => {
  it("attaches, detaches, and creates contacts for an opportunity", async () => {
    const opp = await createOpportunity(userId, opportunityCreateSchema.parse({ company: "Echo", role: "Head" }));
    const contact = await createContact(userId, contactCreateSchema.parse({ name: "Sam Recruiter", type: "recruiter", email: "" }));
    expect(contact.email).toBeNull();
    const link = await attachContact(userId, opp.id, contact.id, "recruiter");
    expect(link?.contact.name).toBe("Sam Recruiter");
    expect(await attachContact(otherUserId, opp.id, contact.id, null)).toBeNull();

    const inline = await createContactForOpportunity(userId, opp.id, contactCreateSchema.parse({ name: "Hiring Manager" }), "hiring_manager");
    expect(inline).not.toBeNull();
    const detail = await getOpportunity(opp.id, userId);
    expect(detail!.opportunityContacts).toHaveLength(2);

    expect(await detachContact(userId, opp.id, contact.id)).toBe(true);
    const contacts = await listContacts(userId);
    expect(contacts.find((c) => c.id === inline!.id)?.opportunityContacts[0].opportunity.company).toBe("Echo");
  });

  it("marks documents as sent and logs it", async () => {
    const opp = await createOpportunity(userId, opportunityCreateSchema.parse({ company: "Foxtrot", role: "Head" }));
    const doc = await createDocument(userId, { type: "resume", name: "Resume v2" });
    const link = await markDocumentSent(userId, opp.id, doc.id);
    expect(link?.document.name).toBe("Resume v2");
    const docs = await listDocuments(userId);
    expect(docs.find((d) => d.id === doc.id)?.sentTo[0].opportunity.company).toBe("Foxtrot");
    const detail = await getOpportunity(opp.id, userId);
    expect(detail!.activities.some((a) => a.type === "emailed")).toBe(true);
  });
});

describe("offers", () => {
  it("moves the opportunity to offer and flattens company data", async () => {
    const opp = await createOpportunity(userId, opportunityCreateSchema.parse({ company: "Golf", role: "CRO", status: "interviewing" }));
    const input = offerUpsertSchema.parse({ opportunityId: opp.id, baseComp: "250", equityValue: 400, vestYears: 4 });
    const offer = await upsertOffer(userId, input);
    expect(offer?.baseComp).toBe(250);
    const refreshed = await getOpportunity(opp.id, userId);
    expect(refreshed!.status).toBe("offer");
    const offers = await listOffers(userId);
    expect(offers.find((o) => o.id === offer!.id)?.company).toBe("Golf");
    expect(await upsertOffer(otherUserId, input)).toBeNull();
    expect(await deleteOffer(userId, opp.id)).toBe(true);
  });
});

describe("prep and follow-ups", () => {
  it("stores prep sheets per opportunity and follow-up drafts per interview", async () => {
    const opp = await createOpportunity(userId, opportunityCreateSchema.parse({ company: "Hotel", role: "GM" }));
    const interview = (await createInterview(userId, interviewCreateSchema.parse({ opportunityId: opp.id, round: "Final" })))!;
    await savePrep({ opportunityId: opp.id, interviewId: interview.id, content: JSON.stringify({ headline: "x" }), model: "m", promptVersion: 2 });
    expect(await listPreps(opp.id, userId)).toHaveLength(1);
    expect(await listPreps(opp.id, otherUserId)).toHaveLength(0);

    const draft = await saveFollowUp({ interviewId: interview.id, subject: "Thanks", body: "Hi", model: "m" });
    expect(await markFollowUpSent(draft.id, otherUserId)).toBeNull();
    const sent = await markFollowUpSent(draft.id, userId);
    expect(sent?.sentAt).toBeTruthy();
    const detail = await getOpportunity(opp.id, userId);
    expect(detail!.activities.some((a) => a.type === "followed_up")).toBe(true);
    expect(detail!.interviews[0].followUps[0].subject).toBe("Thanks");
  });
});

describe("profile", () => {
  it("upserts", async () => {
    await upsertProfile(userId, { resumeText: "Resume" });
    await upsertProfile(userId, { linkedInUrl: "https://linkedin.com/in/x" });
    const profile = await getProfile(userId);
    expect(profile?.resumeText).toBe("Resume");
    expect(profile?.linkedInUrl).toContain("linkedin");
  });
});

describe("rate limit", () => {
  it("blocks after max attempts within the window and resets", async () => {
    const key = "test:limit";
    for (let i = 0; i < 3; i++) expect((await consumeRateLimit(key, 3, 60_000)).allowed).toBe(true);
    expect((await consumeRateLimit(key, 3, 60_000)).allowed).toBe(false);
    await resetRateLimit(key);
    expect((await consumeRateLimit(key, 3, 60_000)).allowed).toBe(true);
  });

  it("starts a new window after expiry", async () => {
    const key = "test:expiry";
    await consumeRateLimit(key, 1, 1);
    await new Promise((r) => setTimeout(r, 5));
    expect((await consumeRateLimit(key, 1, 1)).allowed).toBe(true);
  });
});
