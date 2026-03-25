"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  saved: { bg: "bg-warm-200", text: "text-warm-700", border: "border-warm-300" },
  applied: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  interviewing: { bg: "bg-terra/10", text: "text-terra-dark", border: "border-terra/20" },
  offer: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  rejected: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  withdrawn: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
};

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "text-green-700",
  neutral: "text-yellow-700",
  negative: "text-red-700",
};

const INTERVIEW_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  scheduled: { bg: "bg-terra/10", text: "text-terra-dark" },
  completed: { bg: "bg-green-50", text: "text-green-700" },
  cancelled: { bg: "bg-red-50", text: "text-red-700" },
  rescheduled: { bg: "bg-yellow-50", text: "text-yellow-700" },
};

interface Interview {
  id: string;
  round: string;
  roundNumber: number;
  dateTime: string | null;
  durationMin: number | null;
  format: string;
  interviewerName: string | null;
  interviewerTitle: string | null;
  interviewerLinkedIn: string | null;
  prepNotes: string | null;
  debriefNotes: string | null;
  questionsAsked: string | null;
  questionsToAsk: string | null;
  status: string;
  sentiment: string | null;
  nextSteps: string | null;
}

interface Contact {
  id: string;
  name: string;
  title: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  linkedIn: string | null;
  type: string;
  warmth: string | null;
  notes: string | null;
}

interface OpportunityContactJoin {
  id: string;
  role: string | null;
  contact: Contact;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  date: string;
}

interface DocumentJoin {
  id: string;
  document: {
    id: string;
    type: string;
    name: string;
    version: string | null;
  };
  sentAt: string;
}

interface Opportunity {
  id: string;
  company: string;
  role: string;
  jdLink: string | null;
  compMin: number | null;
  compMax: number | null;
  location: string | null;
  remote: boolean;
  fitScore: number | null;
  priority: string;
  tier: number | null;
  status: string;
  appliedDate: string | null;
  source: string | null;
  notes: string | null;
  prosConsNotes: string | null;
  keyGaps: string | null;
  createdAt: string;
  updatedAt: string;
  interviews: Interview[];
  opportunityContacts: OpportunityContactJoin[];
  activities: Activity[];
  documentsSent: DocumentJoin[];
}

interface Props {
  opportunity: Opportunity;
}

export default function OpportunityDetail({ opportunity: opp }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "interviews" | "prep" | "notes" | "contacts" | "activity">("overview");
  const [showAddInterview, setShowAddInterview] = useState(false);
  const [expandedInterview, setExpandedInterview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debriefingInterview, setDebriefingInterview] = useState<string | null>(null);
  const [isDebriefSubmitting, setIsDebriefSubmitting] = useState(false);
  const [aiPrep, setAiPrep] = useState<string | null>(null);
  const [isGeneratingPrep, setIsGeneratingPrep] = useState(false);
  const [aiPrepError, setAiPrepError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditSaving, setIsEditSaving] = useState(false);
  const [followUpEmail, setFollowUpEmail] = useState<string | null>(null);
  const [followUpSubject, setFollowUpSubject] = useState<string | null>(null);
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const [followUpInterviewId, setFollowUpInterviewId] = useState<string | null>(null);
  const [followUpError, setFollowUpError] = useState<string | null>(null);

  const statusColor = STATUS_COLORS[opp.status] || STATUS_COLORS.saved;

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/opportunities/${opp.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) router.refresh();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleAddInterview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data: Record<string, any> = { opportunityId: opp.id };

    formData.forEach((value, key) => {
      if (value === "") return;
      if (key === "roundNumber" || key === "durationMin") {
        data[key] = parseInt(value as string, 10);
      } else {
        data[key] = value;
      }
    });

    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setShowAddInterview(false);
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to add interview:", err);
    }
    setIsSubmitting(false);
  };

  const handleDebrief = async (e: React.FormEvent<HTMLFormElement>, interviewId: string) => {
    e.preventDefault();
    setIsDebriefSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data: Record<string, any> = {};
    formData.forEach((value, key) => {
      if (value === "") return;
      data[key] = value;
    });
    // Mark as completed when debriefing
    data.status = "completed";

    try {
      const res = await fetch(`/api/interviews/${interviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setDebriefingInterview(null);
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to save debrief:", err);
    }
    setIsDebriefSubmitting(false);
  };

  const handleGenerateAiPrep = async () => {
    setIsGeneratingPrep(true);
    setAiPrepError(null);
    try {
      const res = await fetch("/api/ai-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId: opp.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setAiPrep(data.prep);
      } else {
        setAiPrepError(data.error || "Failed to generate prep");
      }
    } catch {
      setAiPrepError("Failed to connect to AI service");
    }
    setIsGeneratingPrep(false);
  };

  const handleDeleteOpportunity = async () => {
    if (!confirm(`Delete ${opp.company} — ${opp.role}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/opportunities/${opp.id}`, { method: "DELETE" });
      if (res.ok) router.push("/dashboard");
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const generateFollowUp = async (interviewId: string) => {
    setIsGeneratingFollowUp(true);
    setFollowUpInterviewId(interviewId);
    setFollowUpError(null);
    setFollowUpEmail(null);
    setFollowUpSubject(null);
    try {
      const res = await fetch("/api/ai-followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate follow-up");
      }
      const { subject, email } = await res.json();
      setFollowUpSubject(subject);
      setFollowUpEmail(email);
    } catch (err: any) {
      setFollowUpError(err.message);
    } finally {
      setIsGeneratingFollowUp(false);
    }
  };

  const handleEditSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsEditSaving(true);
    const formData = new FormData(e.currentTarget);
    const data: Record<string, any> = {};

    formData.forEach((value, key) => {
      if (key === "remote") return; // handled separately
      if (value === "" && (key === "compMin" || key === "compMax" || key === "fitScore" || key === "tier")) {
        data[key] = null;
        return;
      }
      if (key === "compMin" || key === "compMax" || key === "fitScore" || key === "tier") {
        data[key] = parseInt(value as string, 10);
      } else {
        data[key] = value || null;
      }
    });

    // Checkbox won't appear in FormData if unchecked
    data.remote = formData.has("remote");
    // company and role should not be null
    data.company = formData.get("company") as string;
    data.role = formData.get("role") as string;

    try {
      const res = await fetch(`/api/opportunities/${opp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setIsEditing(false);
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to update opportunity:", err);
    }
    setIsEditSaving(false);
  };

  return (
    <div className="min-h-screen bg-warm-100">
      {/* Top bar */}
      <header className="border-b border-warm-300/60 px-6 py-3 flex items-center gap-4 bg-warm-50/80 backdrop-blur-sm sticky top-0 z-10 animate-fade-in">
        <Link
          href="/dashboard"
          className="text-xs font-medium text-warm-600 hover:text-warm-900 bg-warm-100/80 hover:bg-warm-200 px-3 py-1.5 rounded-lg border border-warm-300/60 hover:border-warm-400 shadow-card hover:shadow-card-hover hover:-translate-y-px transition-all duration-200"
        >
          ← Dashboard
        </Link>
        <div className="h-4 w-px bg-warm-300" />
        <span className="text-xs text-warm-600">{opp.company}</span>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-fade-in-up">
        {/* Header section */}
        {isEditing ? (
          <div className="mb-8 bg-white border border-warm-300 rounded-lg p-5 shadow-sm">
            <h2 className="text-sm font-medium text-warm-700 mb-4">Edit Opportunity</h2>
            <form onSubmit={handleEditSave} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormInput name="company" label="Company" required defaultValue={opp.company} />
              <FormInput name="role" label="Role" required defaultValue={opp.role} />
              <FormInput name="jdLink" label="JD Link" type="url" defaultValue={opp.jdLink || ""} />
              <FormInput name="compMin" label="Comp Min (K)" type="number" defaultValue={opp.compMin != null ? String(opp.compMin) : ""} placeholder="e.g. 150" />
              <FormInput name="compMax" label="Comp Max (K)" type="number" defaultValue={opp.compMax != null ? String(opp.compMax) : ""} placeholder="e.g. 200" />
              <FormInput name="location" label="Location" defaultValue={opp.location || ""} />
              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  name="remote"
                  id="edit-remote"
                  defaultChecked={opp.remote}
                  className="rounded border-warm-300 text-terra focus:ring-terra"
                />
                <label htmlFor="edit-remote" className="text-xs font-medium text-warm-600">Remote</label>
              </div>
              <FormInput name="fitScore" label="Fit Score (0-100)" type="number" defaultValue={opp.fitScore != null ? String(opp.fitScore) : ""} placeholder="0-100" />
              <FormSelect name="priority" label="Priority" options={["low", "medium", "high"]} defaultValue={opp.priority} />
              <FormInput name="tier" label="Tier (1-3)" type="number" defaultValue={opp.tier != null ? String(opp.tier) : ""} placeholder="1-3" />
              <FormInput name="source" label="Source" defaultValue={opp.source || ""} />
              <div />
              <div className="col-span-1 sm:col-span-3">
                <label className="block text-xs font-medium text-warm-600 mb-1">Notes</label>
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={opp.notes || ""}
                  className="w-full px-3 py-2 bg-warm-50 border border-warm-300 rounded-lg text-warm-900 text-sm focus:outline-none focus:border-terra transition-colors resize-none"
                />
              </div>
              <div className="col-span-1 sm:col-span-3">
                <label className="block text-xs font-medium text-warm-600 mb-1">Key Gaps</label>
                <textarea
                  name="keyGaps"
                  rows={2}
                  defaultValue={opp.keyGaps || ""}
                  className="w-full px-3 py-2 bg-warm-50 border border-warm-300 rounded-lg text-warm-900 text-sm focus:outline-none focus:border-terra transition-colors resize-none"
                />
              </div>
              <div className="col-span-1 sm:col-span-3">
                <label className="block text-xs font-medium text-warm-600 mb-1">Pros &amp; Cons</label>
                <textarea
                  name="prosConsNotes"
                  rows={2}
                  defaultValue={opp.prosConsNotes || ""}
                  className="w-full px-3 py-2 bg-warm-50 border border-warm-300 rounded-lg text-warm-900 text-sm focus:outline-none focus:border-terra transition-colors resize-none"
                />
              </div>
              <div className="col-span-1 sm:col-span-3 flex gap-2 justify-end">
                <button type="button" onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs text-warm-600 hover:text-warm-900 transition-colors">Cancel</button>
                <button type="submit" disabled={isEditSaving} className="px-4 py-1.5 text-xs font-medium bg-terra hover:bg-terra-light disabled:opacity-50 text-white rounded-lg transition-colors">
                  {isEditSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        ) : (
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-semibold text-warm-900">{opp.company}</h1>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${statusColor.bg} ${statusColor.text} border ${statusColor.border}`}
              >
                {opp.status}
              </span>
              {opp.tier && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-warm-200 text-warm-700 border border-warm-300">
                  Tier {opp.tier}
                </span>
              )}
            </div>
            <p className="text-base text-warm-600">{opp.role}</p>

            <div className="flex items-center gap-4 mt-3 text-xs text-warm-500">
              {opp.location && (
                <span>{opp.location}{opp.remote ? " · Remote" : ""}</span>
              )}
              {opp.compMin != null && opp.compMax != null && (
                <span>${opp.compMin}K – ${opp.compMax}K</span>
              )}
              {opp.fitScore != null && (
                <span className="text-terra">{opp.fitScore}% fit</span>
              )}
              {opp.source && (
                <span>via {opp.source}</span>
              )}
              {opp.jdLink && (
                <a
                  href={opp.jdLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-terra hover:text-terra transition-colors"
                >
                  View JD →
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={opp.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-warm-300 rounded-lg text-warm-900 focus:outline-none focus:border-terra"
            >
              {["saved", "applied", "interviewing", "offer", "rejected", "withdrawn", "archived"].map(
                (s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                )
              )}
            </select>
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 text-xs text-warm-600 hover:text-warm-900 hover:bg-warm-200 border border-transparent hover:border-warm-300 rounded-lg transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleDeleteOpportunity}
              className="px-3 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-warm-300 mb-6">
          {(
            [
              { key: "overview", label: "Overview" },
              { key: "interviews", label: "Interviews", count: opp.interviews.length },
              { key: "prep", label: "Prep" },
              { key: "notes", label: "Notes" },
              { key: "contacts", label: "Contacts", count: opp.opportunityContacts.length },
              { key: "activity", label: "Activity", count: opp.activities.length },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? "text-warm-900 border-terra"
                  : "text-warm-500 border-transparent hover:text-warm-800"
              }`}
            >
              {tab.label}
              {"count" in tab && tab.count != null && (
                <span className="ml-1.5 text-warm-500">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "overview" && (
          <div className="animate-fade-in-up space-y-6">
            {/* Role snapshot cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/80 backdrop-blur-sm border border-warm-300/60 rounded-xl p-4 shadow-card">
                <p className="text-[10px] font-medium text-warm-500 uppercase tracking-wider mb-1">Role</p>
                <p className="text-sm font-semibold text-warm-900">{opp.role}</p>
                <p className="text-xs text-warm-600 mt-1">{opp.company}</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm border border-warm-300/60 rounded-xl p-4 shadow-card">
                <p className="text-[10px] font-medium text-warm-500 uppercase tracking-wider mb-1">Compensation</p>
                {opp.compMin != null && opp.compMax != null ? (
                  <>
                    <p className="text-sm font-semibold text-warm-900">${opp.compMin}K – ${opp.compMax}K</p>
                    <p className="text-xs text-warm-600 mt-1">Base range</p>
                  </>
                ) : (
                  <p className="text-xs text-warm-500 italic">Not specified</p>
                )}
              </div>
              <div className="bg-white/80 backdrop-blur-sm border border-warm-300/60 rounded-xl p-4 shadow-card">
                <p className="text-[10px] font-medium text-warm-500 uppercase tracking-wider mb-1">Fit & Priority</p>
                <div className="flex items-center gap-3">
                  {opp.fitScore != null ? (
                    <span className="text-sm font-semibold text-terra">{opp.fitScore}%</span>
                  ) : (
                    <span className="text-xs text-warm-500 italic">No score</span>
                  )}
                  {opp.tier && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-warm-200 text-warm-700 border border-warm-300">
                      Tier {opp.tier}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    opp.priority === "high" ? "bg-terra/10 text-terra border border-terra/20" :
                    opp.priority === "low" ? "bg-warm-200 text-warm-500 border border-warm-300" :
                    "bg-warm-200 text-warm-700 border border-warm-300"
                  }`}>
                    {opp.priority}
                  </span>
                </div>
                <p className="text-xs text-warm-600 mt-1">
                  {opp.location || "Location not set"}{opp.remote ? " · Remote" : ""}
                </p>
              </div>
            </div>

            {/* Two-column layout: JD link + key details, and quick stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Left: Notes & JD */}
              <div className="space-y-4">
                {opp.jdLink && (
                  <div className="bg-white/80 backdrop-blur-sm border border-warm-300/60 rounded-xl p-4 shadow-card">
                    <p className="text-[10px] font-medium text-warm-500 uppercase tracking-wider mb-2">Job Description</p>
                    <a
                      href={opp.jdLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-terra hover:text-terra-light font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View Full Job Description
                    </a>
                    <p className="text-[10px] text-warm-400 mt-1.5 break-all">{opp.jdLink}</p>
                  </div>
                )}

                {opp.notes && (
                  <div className="bg-white/80 backdrop-blur-sm border border-warm-300/60 rounded-xl p-4 shadow-card">
                    <p className="text-[10px] font-medium text-warm-500 uppercase tracking-wider mb-2">Notes</p>
                    <p className="text-sm text-warm-800 whitespace-pre-wrap leading-relaxed">{opp.notes}</p>
                  </div>
                )}

                {opp.prosConsNotes && (
                  <div className="bg-white/80 backdrop-blur-sm border border-warm-300/60 rounded-xl p-4 shadow-card">
                    <p className="text-[10px] font-medium text-warm-500 uppercase tracking-wider mb-2">Pros & Cons</p>
                    <p className="text-sm text-warm-800 whitespace-pre-wrap leading-relaxed">{opp.prosConsNotes}</p>
                  </div>
                )}
              </div>

              {/* Right: Quick stats & timeline */}
              <div className="space-y-4">
                <div className="bg-white/80 backdrop-blur-sm border border-warm-300/60 rounded-xl p-4 shadow-card">
                  <p className="text-[10px] font-medium text-warm-500 uppercase tracking-wider mb-3">Quick Stats</p>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-warm-600">Status</span>
                      <span className={`px-2 py-0.5 rounded-full ${statusColor.bg} ${statusColor.text} border ${statusColor.border}`}>
                        {opp.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-warm-600">Interviews</span>
                      <span className="text-warm-900 font-medium">{opp.interviews.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-warm-600">Contacts</span>
                      <span className="text-warm-900 font-medium">{opp.opportunityContacts.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-warm-600">Source</span>
                      <span className="text-warm-900">{opp.source || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-warm-600">Added</span>
                      <span className="text-warm-900">{new Date(opp.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                    {opp.appliedDate && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-warm-600">Applied</span>
                        <span className="text-warm-900">{new Date(opp.appliedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    )}
                  </div>
                </div>

                {opp.keyGaps && (
                  <div className="bg-terra-bg border border-terra/20 rounded-xl p-4 shadow-card">
                    <p className="text-[10px] font-medium text-terra uppercase tracking-wider mb-2">Key Gaps to Address</p>
                    <p className="text-sm text-warm-800 whitespace-pre-wrap leading-relaxed">{opp.keyGaps}</p>
                  </div>
                )}

                {/* Next steps prompt */}
                {opp.interviews.length === 0 && opp.status === "saved" && (
                  <div className="bg-warm-200/50 border border-warm-300/60 rounded-xl p-4">
                    <p className="text-[10px] font-medium text-warm-500 uppercase tracking-wider mb-2">Next Steps</p>
                    <div className="space-y-2">
                      <button
                        onClick={() => setActiveTab("prep")}
                        className="w-full text-left text-xs text-warm-700 hover:text-terra px-3 py-2 rounded-lg hover:bg-white/60 transition-all duration-200 flex items-center gap-2"
                      >
                        <span className="text-terra">→</span> Generate AI prep for this role
                      </button>
                      <button
                        onClick={() => { setActiveTab("interviews"); setShowAddInterview(true); }}
                        className="w-full text-left text-xs text-warm-700 hover:text-terra px-3 py-2 rounded-lg hover:bg-white/60 transition-all duration-200 flex items-center gap-2"
                      >
                        <span className="text-terra">→</span> Schedule your first interview
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "interviews" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-warm-700">Interview Timeline</h2>
              <button
                onClick={() => setShowAddInterview(!showAddInterview)}
                className="px-3 py-1.5 text-xs font-medium bg-terra hover:bg-terra-light text-white rounded-lg transition-colors"
              >
                + Add Interview
              </button>
            </div>

            {showAddInterview && (
              <div className="mb-6 bg-white border border-warm-300 rounded-lg p-5 shadow-sm">
                <form onSubmit={handleAddInterview} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormInput name="round" label="Round Name" required placeholder='e.g. "Recruiter Screen"' />
                  <FormInput name="roundNumber" label="Round #" type="number" defaultValue="1" />
                  <FormInput name="dateTime" label="Date & Time" type="datetime-local" />
                  <FormInput name="durationMin" label="Duration (min)" type="number" placeholder="30" />
                  <FormSelect
                    name="format"
                    label="Format"
                    options={["video", "phone", "onsite", "async"]}
                    defaultValue="video"
                  />
                  <FormSelect
                    name="status"
                    label="Status"
                    options={["scheduled", "completed", "cancelled", "rescheduled"]}
                    defaultValue="scheduled"
                  />
                  <FormInput name="interviewerName" label="Interviewer Name" />
                  <FormInput name="interviewerTitle" label="Interviewer Title" />
                  <FormInput name="interviewerLinkedIn" label="Interviewer LinkedIn" />
                  <div className="col-span-1 sm:col-span-3">
                    <label className="block text-xs font-medium text-warm-600 mb-1">Prep Notes</label>
                    <textarea
                      name="prepNotes"
                      rows={3}
                      className="w-full px-3 py-2 bg-warm-50 border border-warm-300 rounded-lg text-warm-900 text-sm focus:outline-none focus:border-terra transition-colors resize-none"
                      placeholder="Key talking points, things to prepare..."
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-3">
                    <label className="block text-xs font-medium text-warm-600 mb-1">Questions to Ask</label>
                    <textarea
                      name="questionsToAsk"
                      rows={2}
                      className="w-full px-3 py-2 bg-warm-50 border border-warm-300 rounded-lg text-warm-900 text-sm focus:outline-none focus:border-terra transition-colors resize-none"
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-3 flex gap-2 justify-end">
                    <button type="button" onClick={() => setShowAddInterview(false)} className="px-3 py-1.5 text-xs text-warm-600 hover:text-warm-900 transition-colors">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="px-4 py-1.5 text-xs font-medium bg-terra hover:bg-terra-light disabled:opacity-50 text-white rounded-lg transition-colors">
                      {isSubmitting ? "Adding..." : "Add Interview"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {opp.interviews.length === 0 ? (
              <p className="text-sm text-warm-500 py-8 text-center">No interviews yet. Add one to start tracking.</p>
            ) : (
              <div className="space-y-3">
                {opp.interviews.map((interview) => {
                  const isExpanded = expandedInterview === interview.id;
                  const intStatus = INTERVIEW_STATUS_COLORS[interview.status] || INTERVIEW_STATUS_COLORS.scheduled;

                  return (
                    <div key={interview.id} className="bg-white border border-warm-300 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedInterview(isExpanded ? null : interview.id)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-warm-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-warm-200 flex items-center justify-center text-xs font-medium text-warm-700">
                            {interview.roundNumber}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-warm-900">{interview.round}</p>
                            {interview.interviewerName && (
                              <span className="text-xs text-warm-700">
                                {interview.interviewerName}
                                {interview.interviewerTitle && ` · ${interview.interviewerTitle}`}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {interview.sentiment && (
                            <span className={`text-xs ${SENTIMENT_COLORS[interview.sentiment] || "text-warm-700"}`}>
                              {interview.sentiment}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${intStatus.bg} ${intStatus.text}`}>
                            {interview.status}
                          </span>
                          {interview.dateTime && (
                            <span className="text-xs text-warm-600">
                              {new Date(interview.dateTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          )}
                          <span className="text-warm-500 text-xs">{isExpanded ? "▲" : "▼"}</span>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-warm-300">
                          <div className="grid grid-cols-2 gap-6 pt-4">
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                {interview.dateTime && (
                                  <div>
                                    <span className="text-warm-500">When</span>
                                    <p className="text-warm-800 mt-0.5">
                                      {new Date(interview.dateTime).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })}
                                    </p>
                                  </div>
                                )}
                                <div>
                                  <span className="text-warm-500">Format</span>
                                  <p className="text-warm-800 mt-0.5">{interview.format}</p>
                                </div>
                                {interview.durationMin && (
                                  <div>
                                    <span className="text-warm-500">Duration</span>
                                    <p className="text-warm-800 mt-0.5">{interview.durationMin} min</p>
                                  </div>
                                )}
                                {interview.interviewerLinkedIn && (
                                  <div>
                                    <span className="text-warm-500">LinkedIn</span>
                                    <p className="mt-0.5">
                                      <a href={interview.interviewerLinkedIn} target="_blank" rel="noopener noreferrer" className="text-terra hover:text-terra transition-colors">View Profile →</a>
                                    </p>
                                  </div>
                                )}
                              </div>
                              {interview.nextSteps && (
                                <div>
                                  <h4 className="text-xs font-medium text-warm-600 mb-1">Next Steps</h4>
                                  <p className="text-xs text-warm-800">{interview.nextSteps}</p>
                                </div>
                              )}
                            </div>
                            <div className="space-y-4">
                              {interview.prepNotes && (
                                <div>
                                  <h4 className="text-xs font-medium text-warm-600 mb-1">Prep Notes</h4>
                                  <div className="text-xs text-warm-800 whitespace-pre-wrap bg-warm-100 rounded-lg p-3 max-h-48 overflow-y-auto">{interview.prepNotes}</div>
                                </div>
                              )}
                              {interview.debriefNotes && (
                                <div>
                                  <h4 className="text-xs font-medium text-warm-600 mb-1">Debrief</h4>
                                  <div className="text-xs text-warm-800 whitespace-pre-wrap bg-warm-100 rounded-lg p-3 max-h-48 overflow-y-auto">{interview.debriefNotes}</div>
                                </div>
                              )}
                              {interview.questionsAsked && (
                                <div>
                                  <h4 className="text-xs font-medium text-warm-600 mb-1">Questions They Asked</h4>
                                  <div className="text-xs text-warm-800 whitespace-pre-wrap bg-warm-100 rounded-lg p-3">{interview.questionsAsked}</div>
                                </div>
                              )}
                              {interview.questionsToAsk && (
                                <div>
                                  <h4 className="text-xs font-medium text-warm-600 mb-1">Questions to Ask</h4>
                                  <div className="text-xs text-warm-800 whitespace-pre-wrap bg-warm-100 rounded-lg p-3">{interview.questionsToAsk}</div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quick Debrief button */}
                          {interview.status !== "cancelled" && !interview.debriefNotes && debriefingInterview !== interview.id && (
                            <div className="mt-4 pt-3 border-t border-warm-200">
                              <button
                                onClick={() => setDebriefingInterview(interview.id)}
                                className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 rounded-lg transition-colors"
                              >
                                + Quick Debrief
                              </button>
                            </div>
                          )}

                          {/* Debrief form */}
                          {debriefingInterview === interview.id && (
                            <div className="mt-4 pt-4 border-t border-warm-200">
                              <h4 className="text-xs font-medium text-warm-700 mb-3">Post-Interview Debrief</h4>
                              <form onSubmit={(e) => handleDebrief(e, interview.id)} className="space-y-3">
                                <div>
                                  <label className="block text-xs font-medium text-warm-600 mb-1">How did it go?</label>
                                  <div className="flex gap-2">
                                    {["positive", "neutral", "negative"].map((s) => (
                                      <label key={s} className="flex items-center gap-1.5 text-xs cursor-pointer">
                                        <input type="radio" name="sentiment" value={s} defaultChecked={s === (interview.sentiment || "neutral")}
                                          className="text-terra focus:ring-terra" />
                                        <span className={s === "positive" ? "text-green-700" : s === "negative" ? "text-red-600" : "text-yellow-700"}>
                                          {s === "positive" ? "Good" : s === "negative" ? "Tough" : "Neutral"}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-warm-600 mb-1">Debrief Notes</label>
                                  <textarea name="debriefNotes" rows={3} defaultValue={interview.debriefNotes || ""}
                                    placeholder="What went well? What could have gone better? Key takeaways..."
                                    className="w-full px-3 py-2 bg-warm-50 border border-warm-300 rounded-lg text-warm-900 text-sm focus:outline-none focus:border-terra transition-colors resize-none" />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-warm-600 mb-1">Questions They Asked</label>
                                  <textarea name="questionsAsked" rows={2} defaultValue={interview.questionsAsked || ""}
                                    placeholder="Key questions from the interviewer..."
                                    className="w-full px-3 py-2 bg-warm-50 border border-warm-300 rounded-lg text-warm-900 text-sm focus:outline-none focus:border-terra transition-colors resize-none" />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-warm-600 mb-1">Next Steps</label>
                                  <input type="text" name="nextSteps" defaultValue={interview.nextSteps || ""}
                                    placeholder="e.g., Waiting for follow-up, next round scheduled..."
                                    className="w-full px-3 py-2 bg-warm-50 border border-warm-300 rounded-lg text-warm-900 text-sm focus:outline-none focus:border-terra transition-colors" />
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <button type="button" onClick={() => setDebriefingInterview(null)}
                                    className="px-3 py-1.5 text-xs text-warm-600 hover:text-warm-900 transition-colors">Cancel</button>
                                  <button type="submit" disabled={isDebriefSubmitting}
                                    className="px-4 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors">
                                    {isDebriefSubmitting ? "Saving..." : "Save Debrief"}
                                  </button>
                                </div>
                              </form>
                            </div>
                          )}

                          {/* Draft Follow-up Email button */}
                          {interview.debriefNotes && (
                            <div className="mt-4 pt-3 border-t border-warm-200">
                              {followUpInterviewId === interview.id && followUpEmail ? (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-medium text-warm-700">Follow-up Email Draft</h4>
                                    <button
                                      onClick={() => { setFollowUpEmail(null); setFollowUpSubject(null); setFollowUpInterviewId(null); }}
                                      className="text-xs text-warm-500 hover:text-warm-700 transition-colors"
                                    >
                                      Dismiss
                                    </button>
                                  </div>
                                  <div className="bg-warm-50 border border-warm-200 rounded-lg p-3 space-y-2">
                                    <p className="text-xs font-medium text-warm-800">Subject: {followUpSubject}</p>
                                    <div className="border-t border-warm-200 pt-2">
                                      <div className="text-xs text-warm-700 whitespace-pre-wrap">{followUpEmail}</div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(`Subject: ${followUpSubject}\n\n${followUpEmail}`);
                                    }}
                                    className="px-3 py-1.5 text-xs font-medium bg-terra/10 text-terra-dark border border-terra/20 hover:bg-terra/20 rounded-lg transition-colors"
                                  >
                                    Copy to Clipboard
                                  </button>
                                </div>
                              ) : followUpInterviewId === interview.id && followUpError ? (
                                <div className="space-y-2">
                                  <p className="text-xs text-red-600">{followUpError}</p>
                                  <button
                                    onClick={() => generateFollowUp(interview.id)}
                                    className="px-3 py-1.5 text-xs font-medium text-terra-dark border border-terra/20 hover:bg-terra/10 rounded-lg transition-colors"
                                  >
                                    Retry
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => generateFollowUp(interview.id)}
                                  disabled={isGeneratingFollowUp}
                                  className="px-3 py-1.5 text-xs font-medium bg-terra/10 text-terra-dark border border-terra/20 hover:bg-terra/20 disabled:opacity-50 rounded-lg transition-colors"
                                >
                                  {isGeneratingFollowUp && followUpInterviewId === interview.id ? "Generating..." : "Draft Follow-up Email"}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "prep" && (
          <div className="space-y-6">
            {/* AI Prep Generation */}
            <div className="bg-white border border-warm-300 rounded-lg p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-medium text-warm-600 uppercase tracking-wider">AI-Powered Prep</h3>
                <button
                  onClick={handleGenerateAiPrep}
                  disabled={isGeneratingPrep}
                  className="px-4 py-1.5 text-xs font-medium bg-terra hover:bg-terra-light disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {isGeneratingPrep ? (
                    <>
                      <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : aiPrep ? "Regenerate" : "Generate Tailored Prep"}
                </button>
              </div>
              <p className="text-xs text-warm-500 mb-3">
                Uses your <Link href="/profile" className="text-terra hover:text-terra-light">profile</Link> (resume + LinkedIn) to generate prep tailored to this specific role.
              </p>

              {aiPrepError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
                  {aiPrepError}
                  {aiPrepError.includes("profile") && (
                    <Link href="/profile" className="ml-2 text-terra hover:text-terra-light font-medium">Set up profile →</Link>
                  )}
                </div>
              )}

              {aiPrep && (
                <div className="mt-3 prose prose-sm max-w-none text-warm-800 text-sm whitespace-pre-wrap bg-warm-50 rounded-lg p-4 max-h-[600px] overflow-y-auto border border-warm-200">
                  {aiPrep}
                </div>
              )}
            </div>

            {/* Next interview context */}
            {(() => {
              const scheduled = opp.interviews
                .filter((i) => i.status === "scheduled")
                .sort((a, b) => (a.dateTime || "").localeCompare(b.dateTime || ""));
              const nextInterview = scheduled[0];

              return (
                <>
                  {nextInterview ? (
                    <div className="bg-terra/5 border border-terra/20 rounded-lg p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-warm-900">Next Up: {nextInterview.round}</h3>
                        {nextInterview.dateTime && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-terra/10 text-terra border border-terra/20">
                            {new Date(nextInterview.dateTime).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-warm-500">Format</span>
                          <p className="text-warm-800 mt-0.5">{nextInterview.format}</p>
                        </div>
                        {nextInterview.durationMin && (
                          <div>
                            <span className="text-warm-500">Duration</span>
                            <p className="text-warm-800 mt-0.5">{nextInterview.durationMin} min</p>
                          </div>
                        )}
                        {nextInterview.interviewerName && (
                          <div>
                            <span className="text-warm-500">Interviewer</span>
                            <p className="text-warm-800 mt-0.5">
                              {nextInterview.interviewerName}
                              {nextInterview.interviewerTitle && <span className="text-warm-500"> · {nextInterview.interviewerTitle}</span>}
                            </p>
                            {nextInterview.interviewerLinkedIn && (
                              <a href={nextInterview.interviewerLinkedIn} target="_blank" rel="noopener noreferrer" className="text-terra hover:text-terra-light text-[10px]">LinkedIn →</a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-warm-200 border border-warm-300 rounded-lg p-4 text-center">
                      <p className="text-sm text-warm-600">No upcoming interviews scheduled.</p>
                      <p className="text-xs text-warm-500 mt-1">Add an interview from the Interviews tab to see prep notes here.</p>
                    </div>
                  )}

                  {/* Company & Role context */}
                  <div className="bg-white border border-warm-300 rounded-lg p-5">
                    <h3 className="text-xs font-medium text-warm-600 uppercase tracking-wider mb-3">Role Context</h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-warm-500">Company</span>
                        <p className="text-warm-900 font-medium mt-0.5">{opp.company}</p>
                      </div>
                      <div>
                        <span className="text-warm-500">Role</span>
                        <p className="text-warm-900 font-medium mt-0.5">{opp.role}</p>
                      </div>
                      {opp.location && (
                        <div>
                          <span className="text-warm-500">Location</span>
                          <p className="text-warm-800 mt-0.5">{opp.location}{opp.remote ? " · Remote" : ""}</p>
                        </div>
                      )}
                      {opp.compMin != null && opp.compMax != null && (
                        <div>
                          <span className="text-warm-500">Comp Range</span>
                          <p className="text-warm-800 mt-0.5">${opp.compMin}K – ${opp.compMax}K</p>
                        </div>
                      )}
                      {opp.fitScore != null && (
                        <div>
                          <span className="text-warm-500">Fit Score</span>
                          <p className={`mt-0.5 font-medium ${opp.fitScore >= 80 ? "text-green-700" : opp.fitScore >= 60 ? "text-yellow-700" : "text-red-600"}`}>
                            {opp.fitScore}%
                          </p>
                        </div>
                      )}
                      {opp.jdLink && (
                        <div>
                          <span className="text-warm-500">Job Description</span>
                          <p className="mt-0.5">
                            <a href={opp.jdLink} target="_blank" rel="noopener noreferrer" className="text-terra hover:text-terra-light">
                              View JD →
                            </a>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Key Gaps to address */}
                  {opp.keyGaps && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-5">
                      <h3 className="text-xs font-medium text-red-700 uppercase tracking-wider mb-2">Key Gaps to Address</h3>
                      <div className="text-sm text-red-800 whitespace-pre-wrap">{opp.keyGaps}</div>
                    </div>
                  )}

                  {/* Prep Notes for the next interview */}
                  {nextInterview?.prepNotes && (
                    <div className="bg-white border border-warm-300 rounded-lg p-5">
                      <h3 className="text-xs font-medium text-warm-600 uppercase tracking-wider mb-2">Prep Notes — {nextInterview.round}</h3>
                      <div className="text-sm text-warm-800 whitespace-pre-wrap">{nextInterview.prepNotes}</div>
                    </div>
                  )}

                  {/* Questions to Ask */}
                  {nextInterview?.questionsToAsk && (
                    <div className="bg-white border border-warm-300 rounded-lg p-5">
                      <h3 className="text-xs font-medium text-warm-600 uppercase tracking-wider mb-2">Questions to Ask</h3>
                      <div className="text-sm text-warm-800 whitespace-pre-wrap">{nextInterview.questionsToAsk}</div>
                    </div>
                  )}

                  {/* Contacts involved */}
                  {opp.opportunityContacts.length > 0 && (
                    <div className="bg-white border border-warm-300 rounded-lg p-5">
                      <h3 className="text-xs font-medium text-warm-600 uppercase tracking-wider mb-3">Key Contacts</h3>
                      <div className="space-y-2">
                        {opp.opportunityContacts.map(({ id, role, contact }) => (
                          <div key={id} className="flex items-center justify-between text-xs py-1.5 border-b border-warm-200 last:border-0">
                            <div>
                              <span className="text-warm-900 font-medium">{contact.name}</span>
                              {contact.title && <span className="text-warm-500"> · {contact.title}</span>}
                              {role && <span className="text-terra ml-1.5 px-1.5 py-0.5 rounded bg-terra/10 text-[10px]">{role}</span>}
                            </div>
                            <div className="flex gap-2">
                              {contact.email && <a href={`mailto:${contact.email}`} className="text-terra hover:text-terra-light">Email</a>}
                              {contact.linkedIn && <a href={contact.linkedIn} target="_blank" rel="noopener noreferrer" className="text-terra hover:text-terra-light">LinkedIn</a>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* General notes */}
                  {opp.notes && (
                    <div className="bg-white border border-warm-300 rounded-lg p-5">
                      <h3 className="text-xs font-medium text-warm-600 uppercase tracking-wider mb-2">General Notes</h3>
                      <div className="text-sm text-warm-800 whitespace-pre-wrap">{opp.notes}</div>
                    </div>
                  )}

                  {/* Previous interview debriefs */}
                  {opp.interviews.filter((i) => i.status === "completed" && i.debriefNotes).length > 0 && (
                    <div className="bg-white border border-warm-300 rounded-lg p-5">
                      <h3 className="text-xs font-medium text-warm-600 uppercase tracking-wider mb-3">Previous Interview Debriefs</h3>
                      <div className="space-y-3">
                        {opp.interviews
                          .filter((i) => i.status === "completed" && i.debriefNotes)
                          .map((i) => (
                            <div key={i.id} className="border-b border-warm-200 last:border-0 pb-3 last:pb-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-warm-800">{i.round}</span>
                                {i.sentiment && (
                                  <span className={`text-[10px] ${SENTIMENT_COLORS[i.sentiment]}`}>{i.sentiment}</span>
                                )}
                                {i.dateTime && (
                                  <span className="text-[10px] text-warm-500">{new Date(i.dateTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                                )}
                              </div>
                              <p className="text-xs text-warm-700 whitespace-pre-wrap">{i.debriefNotes}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {activeTab === "notes" && (
          <div className="space-y-6">
            {opp.notes && (
              <div>
                <h3 className="text-xs font-medium text-warm-600 uppercase tracking-wider mb-2">General Notes</h3>
                <div className="bg-white border border-warm-300 rounded-lg p-4 text-sm text-warm-800 whitespace-pre-wrap">{opp.notes}</div>
              </div>
            )}
            {opp.keyGaps && (
              <div>
                <h3 className="text-xs font-medium text-warm-600 uppercase tracking-wider mb-2">Key Gaps</h3>
                <div className="bg-warm-800 border border-red-500/20 rounded-lg p-4 text-sm text-warm-800 whitespace-pre-wrap">{opp.keyGaps}</div>
              </div>
            )}
            {opp.prosConsNotes && (
              <div>
                <h3 className="text-xs font-medium text-warm-600 uppercase tracking-wider mb-2">Pros & Cons</h3>
                <div className="bg-white border border-warm-300 rounded-lg p-4 text-sm text-warm-800 whitespace-pre-wrap">{opp.prosConsNotes}</div>
              </div>
            )}
            {opp.documentsSent.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-warm-600 uppercase tracking-wider mb-2">Documents Sent</h3>
                <div className="space-y-2">
                  {opp.documentsSent.map((doc) => (
                    <div key={doc.id} className="bg-white border border-warm-300 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-warm-900">{doc.document.name}</p>
                        <p className="text-xs text-warm-600">{doc.document.type} {doc.document.version && `· ${doc.document.version}`}</p>
                      </div>
                      <span className="text-xs text-warm-500">{new Date(doc.sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!opp.notes && !opp.keyGaps && !opp.prosConsNotes && opp.documentsSent.length === 0 && (
              <p className="text-sm text-warm-500 py-8 text-center">No notes yet.</p>
            )}
          </div>
        )}

        {activeTab === "contacts" && (
          <div>
            {opp.opportunityContacts.length === 0 ? (
              <p className="text-sm text-warm-500 py-8 text-center">No contacts linked to this opportunity.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {opp.opportunityContacts.map(({ id, role, contact }) => (
                  <div key={id} className="bg-white border border-warm-300 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-warm-900">{contact.name}</h3>
                        <p className="text-xs text-warm-700 mt-0.5">{contact.title}{contact.company && ` at ${contact.company}`}</p>
                      </div>
                      <div className="flex gap-1.5">
                        {role && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-terra/10 text-terra border border-terra/20">{role}</span>
                        )}
                        {contact.warmth && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                            contact.warmth === "hot" ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : contact.warmth === "warm" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                            : "bg-warm-200 text-warm-700 border-warm-300"
                          }`}>{contact.warmth}</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 space-y-1 text-xs">
                      {contact.email && (
                        <p className="text-warm-700"><span className="text-warm-500">Email:</span> <a href={`mailto:${contact.email}`} className="text-terra hover:text-terra">{contact.email}</a></p>
                      )}
                      {contact.phone && (
                        <p className="text-warm-700"><span className="text-warm-500">Phone:</span> {contact.phone}</p>
                      )}
                      {contact.linkedIn && (
                        <p><a href={contact.linkedIn} target="_blank" rel="noopener noreferrer" className="text-terra hover:text-terra">LinkedIn →</a></p>
                      )}
                    </div>
                    {contact.notes && (
                      <p className="text-xs text-warm-600 mt-3 border-t border-warm-300 pt-2">{contact.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "activity" && (
          <div>
            {opp.activities.length === 0 ? (
              <p className="text-sm text-warm-500 py-8 text-center">No activity recorded.</p>
            ) : (
              <div className="space-y-1">
                {opp.activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 py-2 text-xs">
                    <span className="text-warm-500 shrink-0 w-16">{new Date(activity.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] ${
                      activity.type === "interviewed" ? "bg-terra/10 text-terra"
                      : activity.type === "applied" ? "bg-yellow-500/10 text-yellow-400"
                      : "bg-warm-200 text-warm-700"
                    }`}>{activity.type}</span>
                    <span className="text-warm-800">{activity.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FormInput({ name, label, type = "text", required = false, placeholder, defaultValue }: {
  name: string; label: string; type?: string; required?: boolean; placeholder?: string; defaultValue?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-warm-600 mb-1">{label}</label>
      <input name={name} type={type} required={required} placeholder={placeholder} defaultValue={defaultValue}
        className="w-full px-3 py-2 bg-warm-50 border border-warm-300 rounded-lg text-warm-900 text-sm focus:outline-none focus:border-terra transition-colors" />
    </div>
  );
}

function FormSelect({ name, label, options, defaultValue }: {
  name: string; label: string; options: string[]; defaultValue?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-warm-600 mb-1">{label}</label>
      <select name={name} defaultValue={defaultValue}
        className="w-full px-3 py-2 bg-warm-50 border border-warm-300 rounded-lg text-warm-900 text-sm focus:outline-none focus:border-terra transition-colors">
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
        ))}
      </select>
    </div>
  );
}
