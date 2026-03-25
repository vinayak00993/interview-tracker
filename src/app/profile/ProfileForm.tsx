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
    <div className="min-h-screen bg-warm-100">
      <header className="border-b border-warm-300/60 px-6 py-3 flex items-center gap-4 bg-warm-50/80 backdrop-blur-sm sticky top-0 z-10 animate-fade-in">
        <Link href="/dashboard" className="text-xs text-warm-600 hover:text-warm-900 transition-colors">
          ← Dashboard
        </Link>
        <div className="h-4 w-px bg-warm-300" />
        <h1 className="text-sm font-semibold text-warm-900">Your Profile</h1>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 animate-fade-in-up">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-warm-900">AI Prep Profile</h2>
          <p className="text-sm text-warm-600 mt-1">
            Upload your resume and add your LinkedIn info. This data is used to generate tailored interview prep for each opportunity.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Resume upload */}
          <div className="bg-white/80 backdrop-blur-sm border border-warm-300/60 rounded-xl p-5 shadow-card">
            <h3 className="text-xs font-medium text-warm-600 uppercase tracking-wider mb-3">Resume</h3>

            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-warm-300 rounded-lg p-4 text-center cursor-pointer hover:border-terra/40 hover:bg-terra/5 transition-colors"
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
                    <p className="text-sm text-warm-900 font-medium">{resumeFileName}</p>
                    <p className="text-xs text-warm-500 mt-1">Click to change</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-warm-600">Click to upload your resume (.docx or .txt)</p>
                    <p className="text-xs text-warm-400 mt-1">We'll extract the text content for AI prep generation</p>
                  </div>
                )}
                {uploadError && (
                  <p className="text-xs text-red-600 mt-2">{uploadError}</p>
                )}
              </div>

              {(resumeText || profile?.resumeText) && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-warm-600">Extracted Resume Text</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-warm-400">{(resumeText || "").length} chars</span>
                      <button
                        type="button"
                        onClick={() => setResumeText("")}
                        className="text-[10px] text-terra hover:text-terra-light transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 bg-warm-50 border border-warm-300 rounded-lg text-warm-900 text-xs font-mono focus:outline-none focus:border-terra transition-colors resize-y"
                    placeholder="Or paste your resume text directly here..."
                  />
                </div>
              )}

              {!resumeText && !profile?.resumeText && (
                <div>
                  <label className="text-xs font-medium text-warm-600">Or paste your resume text</label>
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    rows={6}
                    className="w-full mt-1 px-3 py-2 bg-warm-50 border border-warm-300 rounded-lg text-warm-900 text-xs font-mono focus:outline-none focus:border-terra transition-colors resize-y"
                    placeholder="Paste your resume content here..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* LinkedIn */}
          <div className="bg-white/80 backdrop-blur-sm border border-warm-300/60 rounded-xl p-5 shadow-card">
            <h3 className="text-xs font-medium text-warm-600 uppercase tracking-wider mb-3">LinkedIn</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-warm-600 mb-1">LinkedIn Profile URL</label>
                <input
                  name="linkedInUrl"
                  type="url"
                  defaultValue={profile?.linkedInUrl || ""}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full px-3 py-2 bg-warm-50 border border-warm-300 rounded-lg text-warm-900 text-sm focus:outline-none focus:border-terra transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-warm-600 mb-1">LinkedIn About Section</label>
                <textarea
                  name="linkedInAbout"
                  rows={4}
                  defaultValue={profile?.linkedInAbout || ""}
                  placeholder="Paste your LinkedIn About/Summary section here..."
                  className="w-full px-3 py-2 bg-warm-50 border border-warm-300 rounded-lg text-warm-900 text-sm focus:outline-none focus:border-terra transition-colors resize-y"
                />
                <p className="text-[10px] text-warm-400 mt-1">
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
              className="px-5 py-2 text-sm font-medium bg-terra hover:bg-terra-light disabled:opacity-50 text-white rounded-lg shadow-card hover:shadow-glow hover:-translate-y-px transition-all duration-200"
            >
              {isSaving ? "Saving..." : "Save Profile"}
            </button>
            {saveStatus && (
              <span className={`text-xs ${saveStatus.startsWith("Error") ? "text-red-600" : "text-green-700"}`}>
                {saveStatus}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
