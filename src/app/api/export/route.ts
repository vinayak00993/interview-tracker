import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api";
import { prisma } from "@/lib/prisma";

function csvCell(val: string | number | boolean | null | undefined): string {
  if (val == null) return "";
  const str = typeof val === "boolean" ? (val ? "Yes" : "No") : String(val);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

/** GET /api/export?format=csv|json. JSON includes every related record. */
export const GET = withAuth(async (req, _ctx, userId) => {
  const format = new URL(req.url).searchParams.get("format") || "json";
  const stamp = new Date().toISOString().slice(0, 10);

  const opportunities = await prisma.opportunity.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      interviews: { orderBy: { roundNumber: "asc" }, include: { followUps: true } },
      opportunityContacts: { include: { contact: true } },
      documentsSent: { include: { document: true } },
      activities: { orderBy: { date: "desc" } },
      offer: true,
      preps: { orderBy: { createdAt: "desc" } },
    },
  });

  if (format === "csv") {
    const headers = ["Company", "Role", "Status", "Priority", "Tier", "Comp Min ($K)", "Comp Max ($K)", "Location", "Remote", "Fit Score", "Source", "Applied Date", "Interviews", "Next Follow-up", "JD Link", "Created"];
    const rows = opportunities.map((o) => [
      o.company, o.role, o.status, o.priority, o.tier, o.compMin, o.compMax, o.location, o.remote, o.fitScore,
      o.source, o.appliedDate?.slice(0, 10), o.interviews.length, o.followUpAt?.slice(0, 10), o.jdLink, o.createdAt.slice(0, 10),
    ]);
    const csv = [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="interview-tracker-${stamp}.csv"`,
      },
    });
  }

  const [contacts, documents, profile] = await Promise.all([
    prisma.contact.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    prisma.document.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    prisma.userProfile.findUnique({ where: { userId } }),
  ]);
  const payload = {
    exportedAt: new Date().toISOString(),
    profile: profile ? { resumeText: profile.resumeText, linkedInAbout: profile.linkedInAbout, linkedInUrl: profile.linkedInUrl } : null,
    opportunities: opportunities.map((o) => ({ ...o, preps: o.preps.map((p) => ({ ...p, content: JSON.parse(p.content) })) })),
    contacts,
    documents,
  };
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="interview-tracker-${stamp}.json"`,
    },
  });
});
