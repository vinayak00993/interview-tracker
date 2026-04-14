"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Profile {
  resumeText: string | null;
  linkedInAbout: string | null;
  linkedInUrl: string | null;
}

export default function ProfileForm({ profile }: { profile: Profile | null }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [resumeText, setResumeText] = useState(profile?.resumeText || "");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    // If there's a file, use multipart; otherwise JSON
    const file = formData.get("resume") as File;
    setUploadError("");
    if (file && file.size > 0) {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith(".pdf")) {
        setUploadError("PDF is not supported. Please save your resume as .docx or .txt and re-upload.");
        setIsSaving(false);
        return;
      }
      // Multipart upload
      const uploadData = new FormData();
      uploadData.append("resume", file);
      uploadData.append("linkedInAbout", formData.get("linkedInAbout") as string);
      uploadData.append("linkedInUrl", formData.get("linkedInUrl") as string);

      try {
        const res = await fetch("/api/profile", { method: "POST", body: uploadData });
        if (res.ok) {
          const data = await res.json();
          setResumeText(data.resumeText || "");
          setSaveStatus("Profile saved");
          router.refresh();
        } else {
          const err = await res.json();
          setSaveStatus(`Error: ${err.error}`);
        }
      } catch {
        setSaveStatus("Error saving profile");
      }
    } else {
      // JSON update (text fields only)
      try {
        const res = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeText: resumeText || undefined,
            linkedInAbout: formData.get("linkedInAbout") || undefined,
            linkedInUrl: formData.get("linkedInUrl") || undefined,
          }),
        });
        if (res.ok) {
          setSaveStatus("Profile saved");
          router.refresh();
        } else {
          const err = await res.json();
          setSaveStatus(`Error: ${err.error}`);
        }
      } catch {
        setSaveStatus("Error saving profile");
      }
    }
    setIsSaving(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadError("");
      if (file.name.toLowerCase().endsWith(".pdf")) {
        setUploadError("PDF is not supported. Please save your resume as .docx or .txt and re-upload.");
        e.target.value = "";
        return;
      }
      setResumeFileName(file.name);
    }
  };

  return (
    <div className="min-h-screen bg-vellum">
      <header className="manuscript-glass sticky top-0 z-20 animate-fade-in">
        <div className="px-4 sm:px-10 lg:px-16 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-[11px] font-semibold uppercase tracking-label text-ink-700 hover:text-terracotta hover:bg-vellum-high px-3 py-1.5 rounded transition-all">
            ← The Pipeline
          </Link>
          <span className="text-ink-400">/</span>
          <span className="text-[11px] font-semibold uppercase tracking-label text-ink-600">The Author</span>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-vellum-high to-transparent" />
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-10 lg:px-16 py-8 sm:py-10 animate-fade-in-up">
        <div className="mb-8">
          <p className="manuscript-label">About the Author</p>
          <h2 className="manuscript-display text-3xl font-semibold text-ink-900 mt-1">Your Profile</h2>
          <p className="text-sm font-serif italic text-ink-700 mt-3 max-w-lg">
            Upload your resume and add LinkedIn detail. This data tailors every piece of AI prep we generate for you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Resume upload */}
          <div className="bg-vellum-lowest rounded-lg p-5 shadow-card">
            <h3 className="text-xs font-medium text-ink-700 uppercase tracking-label font-semibold mb-3">Resume</h3>

            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="bg-vellum-low rounded-lg p-4 text-center cursor-pointer hover:bg-vellum-mid transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  name="resume"
                  accept=".docx,.txt"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {resumeFileName ? (
                  <div>
                    <p className="text-sm text-ink-900 font-medium">{resumeFileName}</p>
                    <p className="text-xs text-ink-600 mt-1">Click to change</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-ink-700">Click to upload your resume (.docx or .txt)</p>
                    <p className="text-xs text-ink-600 mt-1">We'll extract the text content for AI prep generation</p>
                  </div>
                )}
                {uploadError && (
                  <p className="text-xs text-terracotta mt-2">{uploadError}</p>
                )}
              </div>

              {(resumeText || profile?.resumeText) && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-ink-700">Extracted Resume Text</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-ink-600">{(resumeText || "").length} chars</span>
                      <button
                        type="button"
                        onClick={() => setResumeText("")}
                        className="text-[10px] text-terracotta hover:text-terracotta-deep transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 bg-vellum-low rounded text-ink-900 text-xs font-mono focus:outline-none focus:border-terra transition-colors resize-y"
                    placeholder="Or paste your resume text directly here..."
                  />
                </div>
              )}

              {!resumeText && !profile?.resumeText && (
                <div>
                  <label className="text-xs font-medium text-ink-700">Or paste your resume text</label>
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    rows={6}
                    className="w-full mt-1 px-3 py-2 bg-vellum-low rounded text-ink-900 text-xs font-mono focus:outline-none focus:border-terra transition-colors resize-y"
                    placeholder="Paste your resume content here..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* LinkedIn */}
          <div className="bg-vellum-lowest rounded-lg p-5 shadow-card">
            <h3 className="text-xs font-medium text-ink-700 uppercase tracking-label font-semibold mb-3">LinkedIn</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">LinkedIn Profile URL</label>
                <input
                  name="linkedInUrl"
                  type="url"
                  defaultValue={profile?.linkedInUrl || ""}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full px-3 py-2 bg-vellum-low rounded text-ink-900 text-sm focus:outline-none focus:border-terra transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">LinkedIn About Section</label>
                <textarea
                  name="linkedInAbout"
                  rows={4}
                  defaultValue={profile?.linkedInAbout || ""}
                  placeholder="Paste your LinkedIn About/Summary section here..."
                  className="w-full px-3 py-2 bg-vellum-low rounded text-ink-900 text-sm focus:outline-none focus:border-terra transition-colors resize-y"
                />
                <p className="text-[10px] text-ink-600 mt-1">
                  We use this along with your resume to generate tailored prep for each opportunity.
                </p>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-sm font-medium bg-terracotta hover:bg-terracotta-deep disabled:opacity-50 text-white rounded-lg shadow-card hover:shadow-glow hover:-translate-y-px transition-all duration-200"
            >
              {isSaving ? "Saving..." : "Save Profile"}
            </button>
            {saveStatus && (
              <span className={`text-xs ${saveStatus.startsWith("Error") ? "text-terracotta" : "text-sage"}`}>
                {saveStatus}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
