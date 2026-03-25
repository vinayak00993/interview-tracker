import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findOpportunities } from "@/lib/db";

function escapeCSV(val: string | number | null | undefined): string {
  if (val == null) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const opportunities = await findOpportunities(userId);
    const format = req.nextUrl.searchParams.get("format") || "json";

    if (format === "csv") {
      const headers = [
        "Company", "Role", "Status", "Priority", "Tier",
        "Comp Min ($K)", "Comp Max ($K)", "Location", "Remote",
        "Fit Score", "Source", "Applied Date", "Interviews", "Created"
      ];

      const rows = opportunities.map((o: any) => [
        escapeCSV(o.company),
        escapeCSV(o.role),
        escapeCSV(o.status),
        escapeCSV(o.priority),
        escapeCSV(o.tier),
        escapeCSV(o.compMin),
        escapeCSV(o.compMax),
        escapeCSV(o.location),
        o.remote ? "Yes" : "No",
        escapeCSV(o.fitScore),
        escapeCSV(o.source),
        escapeCSV(o.appliedDate),
        escapeCSV(o._count?.interviews ?? 0),
        escapeCSV(o.createdAt?.split("T")[0]),
      ]);

      const csv = [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="opportunities-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    // JSON format
    return new NextResponse(JSON.stringify(opportunities, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="opportunities-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("GET /api/export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
