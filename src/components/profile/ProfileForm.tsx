"use client";

import { useRef, useState, useTransition } from "react";
import { Button, Card, ErrorText, Field, Input, PageTitle, SectionTitle, SuccessText, Textarea } from "@/components/ui";
import { saveProfileAction } from "@/lib/actions/profile";

interface Profile {
  resumeText: string | null;
  linkedInAbout: string | null;
  linkedInUrl: string | null;
}

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const [resumeText, setResumeText] = useState(profile?.resumeText ?? "");
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    if (!file) return;
    if (file.name.toLowerCase().endsWith(".pdf")) {
      setFileError("PDF is not supported. Save the resume as .docx or .txt, or paste the text below.");
      e.target.value = "";
      setFileName("");
      return;
    }
    setFileName(file.name);
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    form.set("resumeText", resumeText);
    setError(null);
    setSaved(false);
    start(async () => {
      const r = await saveProfileAction(form);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setResumeText(r.data.resumeText ?? "");
      setFileName("");
      if (fileInput.current) fileInput.current.value = "";
      setSaved(true);
    });
  };

  return (
    <div>
      <PageTitle eyebrow="Account" title="Your profile" description="This text feeds every prep sheet and follow-up draft, so the more specific it is, the better they get." />

      <form onSubmit={submit} className="space-y-6">
        <Card>
          <SectionTitle>Resume</SectionTitle>
          <div
            onClick={() => fileInput.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && fileInput.current?.click()}
            className="bg-vellum-low rounded-lg p-4 text-center cursor-pointer hover:bg-vellum-mid transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta/20"
          >
            <input ref={fileInput} type="file" name="resume" accept=".docx,.txt" className="hidden" onChange={onFile} />
            {fileName ? (
              <>
                <p className="text-sm text-ink-900 font-medium">{fileName}</p>
                <p className="text-xs text-ink-600 mt-1">Click to change. The text is extracted when you save.</p>
              </>
            ) : (
              <>
                <p className="text-sm text-ink-700">Click to upload your resume (.docx or .txt)</p>
                <p className="text-xs text-ink-600 mt-1">We extract the text and keep it here for the AI to read.</p>
              </>
            )}
            {fileError && <p className="text-xs text-terracotta mt-2">{fileError}</p>}
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="manuscript-label" htmlFor="resumeText">Resume text</label>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-ink-600">{resumeText.length} chars</span>
                {resumeText && (
                  <button type="button" onClick={() => setResumeText("")} className="text-[10px] font-semibold uppercase tracking-label text-terracotta hover:text-terracotta-deep">
                    Clear
                  </button>
                )}
              </div>
            </div>
            <Textarea id="resumeText" value={resumeText} onChange={(e) => setResumeText(e.target.value)} rows={resumeText ? 12 : 6} className="font-mono text-xs" placeholder="Or paste your resume text here." />
          </div>
        </Card>

        <Card>
          <SectionTitle>LinkedIn</SectionTitle>
          <div className="space-y-4">
            <Field label="Profile URL">
              <Input name="linkedInUrl" type="url" defaultValue={profile?.linkedInUrl ?? ""} placeholder="https://linkedin.com/in/you" />
            </Field>
            <Field label="About section" hint="Paste the About or Summary section from your profile.">
              <Textarea name="linkedInAbout" rows={4} defaultValue={profile?.linkedInAbout ?? ""} />
            </Field>
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={pending}>Save profile</Button>
          <ErrorText>{error}</ErrorText>
          {saved && <SuccessText>Saved</SuccessText>}
        </div>
      </form>
    </div>
  );
}
