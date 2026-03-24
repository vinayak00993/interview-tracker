import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findUserProfile, upsertUserProfile } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;
    const profile = await findUserProfile(userId);
    return NextResponse.json(profile || { resumeText: null, linkedInAbout: null, linkedInUrl: null });
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;
    const contentType = req.headers.get("content-type") || "";

    let resumeText: string | undefined;
    let linkedInAbout: string | undefined;
    let linkedInUrl: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      // Handle file upload
      const formData = await req.formData();
      const file = formData.get("resume") as File | null;
      linkedInAbout = (formData.get("linkedInAbout") as string) || undefined;
      linkedInUrl = (formData.get("linkedInUrl") as string) || undefined;

      if (file && file.size > 0) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (file.type === "application/pdf") {
          try {
            const pdfParse = require("pdf-parse");
            const parsed = await pdfParse(buffer);
            resumeText = parsed.text;
          } catch (pdfErr) {
            console.error("PDF parse failed, trying raw text extraction:", pdfErr);
            // Fallback: extract readable text from PDF buffer
            const raw = buffer.toString("utf-8");
            const textChunks = raw.match(/\(([^)]+)\)/g);
            if (textChunks) {
              resumeText = textChunks.map((c) => c.slice(1, -1)).join(" ");
            } else {
              resumeText = raw.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ").trim();
            }
          }
        } else {
          // Plain text file
          resumeText = buffer.toString("utf-8");
        }
      }
    } else {
      const body = await req.json();
      resumeText = body.resumeText;
      linkedInAbout = body.linkedInAbout;
      linkedInUrl = body.linkedInUrl;
    }

    const profile = await upsertUserProfile(userId, { resumeText, linkedInAbout, linkedInUrl });
    return NextResponse.json(profile);
  } catch (error) {
    console.error("POST /api/profile error:", error);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
