"use server";

import { revalidatePath } from "next/cache";
import mammoth from "mammoth";
import { upsertProfile } from "@/lib/data/profile";
import { profileUpdateSchema } from "@/lib/validation";
import { withUser, validate, fail, succeed, type ActionResult } from "./shared";

const MAX_UPLOAD = 5 * 1024 * 1024;

export async function saveProfileAction(form: FormData): Promise<ActionResult<{ resumeText: string | null }>> {
  return withUser(async (userId) => {
    const v = validate(profileUpdateSchema, {
      resumeText: form.get("resumeText") ?? undefined,
      linkedInAbout: form.get("linkedInAbout") ?? undefined,
      linkedInUrl: form.get("linkedInUrl") ?? undefined,
    });
    if (!v.ok) return fail(v.error);

    const data = { ...v.data };
    const file = form.get("resume");
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_UPLOAD) return fail("Resume must be under 5 MB.");
      const name = file.name.toLowerCase();
      const buffer = Buffer.from(await file.arrayBuffer());
      if (name.endsWith(".docx")) data.resumeText = (await mammoth.extractRawText({ buffer })).value;
      else if (name.endsWith(".txt") || file.type === "text/plain") data.resumeText = buffer.toString("utf-8");
      else return fail("Upload a .docx or .txt file, or paste the resume text.");
    }

    const profile = await upsertProfile(userId, data);
    revalidatePath("/profile");
    return succeed({ resumeText: profile.resumeText });
  });
}
