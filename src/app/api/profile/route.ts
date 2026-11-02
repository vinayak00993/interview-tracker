import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { withAuth, parseJson, jsonError } from "@/lib/api";
import { getProfile, upsertProfile } from "@/lib/data/profile";
import { profileUpdateSchema, formatZodError } from "@/lib/validation";

const MAX_UPLOAD = 5 * 1024 * 1024;

export const GET = withAuth(async (_req, _ctx, userId) => {
  const profile = await getProfile(userId);
  return NextResponse.json(profile ?? { resumeText: null, linkedInAbout: null, linkedInUrl: null });
});

export const POST = withAuth(async (req, _ctx, userId) => {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("resume");
    const fields = profileUpdateSchema.safeParse({
      linkedInAbout: form.get("linkedInAbout") ?? undefined,
      linkedInUrl: form.get("linkedInUrl") ?? undefined,
    });
    if (!fields.success) return jsonError(formatZodError(fields.error), 400);

    let resumeText: string | undefined;
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_UPLOAD) return jsonError("Resume must be under 5 MB", 400);
      const buffer = Buffer.from(await file.arrayBuffer());
      const name = file.name.toLowerCase();
      if (name.endsWith(".docx")) {
        resumeText = (await mammoth.extractRawText({ buffer })).value;
      } else if (name.endsWith(".txt") || file.type === "text/plain") {
        resumeText = buffer.toString("utf-8");
      } else {
        return jsonError("Upload a .docx or .txt file, or paste the resume text.", 400);
      }
    }
    const profile = await upsertProfile(userId, { ...fields.data, ...(resumeText !== undefined ? { resumeText } : {}) });
    return NextResponse.json(profile);
  }

  const parsed = await parseJson(req, profileUpdateSchema);
  if (!parsed.ok) return parsed.response;
  return NextResponse.json(await upsertProfile(userId, parsed.data));
});
