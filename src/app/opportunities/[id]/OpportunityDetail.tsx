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
  const [activeTab, setActiveTab] = useState<"interviews" | "notes" | "contacts" | "activity">("interviews");
  const [showAddInterview, setShowAddInterview] = useState(false);
  const [expandedInterview, setExpandedInterview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleDeleteOpportunity = async () => {
    if (!confirm(`Delete ${opp.company} — ${opp.role}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/opportunities/${opp.id}`, { method: "DELETE" });
      if (res.ok) router.push("/dashboard");
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  return (
    <div className="min-h-screen bg-warm-100">
      {/* Top bar */}
      <header className="border-b border-warm-300 px-6 py-3 flex items-center gap-4 bg-warm-50">
        <Link
          href="/dashboard"
          className="text-xs text-warm-600 hover:text-warm-900 transition-colors"
        >
          ← Dashboard
        </Link>
        <div className="h-4 w-px bg-warm-300" />
        <span className="text-xs text-warm-600">{opp.company}</span>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header section */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold text-warm-900">{opp.company}</h1>
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
              onClick={handleDeleteOpportunity}
              className="px-3 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-warm-300 mb-6">
          {(
            [
              { key: "interviews", label: "Interviews", count: opp.interviews.length },
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
                <form onSubmit={handleAddInterview} className="grid grid-cols-3 gap-4">
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
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-warm-600 mb-1">Prep Notes</label>
                    <textarea
                      name="prepNotes"
                      rows={3}
                      className="w-full px-3 py-2 bg-warm-50 border border-warm-300 rounded-lg text-warm-900 text-sm focus:outline-none focus:border-terra transition-colors resize-none"
                      placeholder="Key talking points, things to prepare..."
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-warm-600 mb-1">Questions to Ask</label>
                    <textarea
                      name="questionsToAsk"
                      rows={2}
                      className="w-full px-3 py-2 bg-warm-50 border border-warm-300 rounded-lg text-warm-900 text-sm focus:outline-none focus:border-terra transition-colors resize-none"
                    />
                  </div>
                  <div className="col-span-3 flex gap-2 justify-end">
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
                                  <div className="text-xs text-warm-800 whitespace-pre-wrap bg-warm-900 rounded-lg p-3 max-h-48 overflow-y-auto">{interview.prepNotes}</div>
                                </div>
                              )}
                              {interview.debriefNotes && (
                                <div>
                                  <h4 className="text-xs font-medium text-warm-600 mb-1">Debrief</h4>
                                  <div className="text-xs text-warm-800 whitespace-pre-wrap bg-warm-900 rounded-lg p-3 max-h-48 overflow-y-auto">{interview.debriefNotes}</div>
                                </div>
                              )}
                              {interview.questionsAsked && (
                                <div>
                                  <h4 className="text-xs font-medium text-warm-600 mb-1">Questions They Asked</h4>
                                  <div className="text-xs text-warm-800 whitespace-pre-wrap bg-warm-900 rounded-lg p-3">{interview.questionsAsked}</div>
                                </div>
                              )}
                              {interview.questionsToAsk && (
                                <div>
                                  <h4 className="text-xs font-medium text-warm-600 mb-1">Questions to Ask</h4>
                                  <div className="text-xs text-warm-800 whitespace-pre-wrap bg-warm-900 rounded-lg p-3">{interview.questionsToAsk}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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
