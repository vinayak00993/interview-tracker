import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findUserProfile, upsertUserProfile } from "@/lib/db";
import mammoth from "mammoth";

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
      const formData = await req.formData();
      const file = formData.get("resume") as File | null;
      linkedInAbout = (formData.get("linkedInAbout") as string) || undefined;
      linkedInUrl = (formData.get("linkedInUrl") as string) || undefined;

      if (file && file.size > 0) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileName = file.name.toLowerCase();

        if (fileName.endsWith(".docx")) {
          // Word document — mammoth is pure JS, works in production
          const result = await mammoth.extractRawText({ buffer });
          resumeText = result.value;
        } else if (fileName.endsWith(".txt") || file.type === "text/plain") {
          resumeText = buffer.toString("utf-8");
        } else if (fileName.endsWith(".pdf")) {
          return NextResponse.json(
            { error: "PDF upload is not supported. Please upload a .docx or .txt file, or paste your resume text directly." },
            { status: 400 }
          );
        } else {
          return NextResponse.json(
            { error: "Unsupported file type. Please upload a .docx or .txt file." },
            { status: 400 }
          );
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
