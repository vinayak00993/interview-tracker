"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const COLUMNS = [
  { status: "saved", label: "Saved", color: "#8a7d6d", bg: "bg-warm-100/40" },
  { status: "applied", label: "Applied", color: "#d4a03c", bg: "bg-amber-50/40" },
  { status: "interviewing", label: "Interviewing", color: "#b33a3a", bg: "bg-terracotta/[0.03]" },
  { status: "offer", label: "Offer", color: "#6b9e5c", bg: "bg-sage-soft/40" },
  { status: "rejected", label: "Rejected", color: "#c44848", bg: "bg-terracotta/10/30" },
  { status: "withdrawn", label: "Withdrawn", color: "#9b7bb8", bg: "bg-vellum-high/30" },
];

const PRIORITY_ICONS: Record<string, string> = {
  high: "↑",
  medium: "→",
  low: "↓",
};

const PRIORITY_BORDER: Record<string, string> = {
  high: "border-l-terra",
  medium: "border-l-amber-400",
  low: "border-l-warm-300",
};

function stringToColor(str: string): string {
  const colors = [
    "#b33a3a", "#d4a03c", "#6b9e5c", "#5b8abf", "#9b7bb8",
    "#c47a5a", "#7a9e8e", "#b07ab0", "#8a7d6d", "#5a8a9e",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function DemoCompanyAvatar({ company, website }: { company: string; website?: string | null }) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  let logoDomain: string;
  if (website) {
    try {
      logoDomain = new URL(website).hostname;
    } catch {
      logoDomain = website.replace(/^https?:\/\//, "").split("/")[0];
    }
  } else {
    logoDomain = company
      .replace(/\s*\(.*?\)\s*/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase() + ".com";
  }
  const logoUrl = `https://www.google.com/s2/favicons?domain=${logoDomain}&sz=128`;
  const initial = company.charAt(0).toUpperCase();
  const color = stringToColor(company);

  useEffect(() => {
    if (imgLoaded || imgError) return;
    const timer = setTimeout(() => setImgError(true), 2000);
    return () => clearTimeout(timer);
  }, [imgLoaded, imgError]);

  const fallback = (
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-semibold text-white shrink-0"
      style={{ backgroundColor: color }}
    >
      {initial}
    </div>
  );

  if (imgError) return fallback;

  return (
    <>
      {!imgLoaded && fallback}
      <img
        src={logoUrl}
        alt={company}
        className={`w-7 h-7 rounded-lg object-contain bg-white border border-warm-200/60 shrink-0 ${imgLoaded ? "" : "hidden"}`}
        onLoad={() => setImgLoaded(true)}
        onError={() => setImgError(true)}
      />
    </>
  );
}

const DEMO_OPPS = [
  { id: "1", company: "Stripe", role: "Head of Strategic Partnerships", location: "San Francisco, CA", fitScore: 92, compMin: 280, compMax: 400, priority: "high", tier: 1, status: "interviewing", interviews: 2, website: "https://stripe.com" },
  { id: "2", company: "Figma", role: "Director of Business Development", location: "San Francisco, CA", fitScore: 88, compMin: 250, compMax: 350, priority: "high", tier: 1, status: "interviewing", interviews: 1, website: "https://figma.com" },
  { id: "3", company: "Notion", role: "Strategic Partnerships Lead", location: "New York, NY", fitScore: 85, compMin: 220, compMax: 320, priority: "medium", tier: 1, status: "applied", interviews: 0, website: "https://notion.so" },
  { id: "4", company: "Databricks", role: "Sr. Director, Alliances", location: "San Francisco, CA", fitScore: 80, compMin: 300, compMax: 420, priority: "high", tier: 1, status: "saved", interviews: 0, website: "https://databricks.com" },
  { id: "5", company: "Vercel", role: "Head of Partnerships", location: "Remote", fitScore: 78, compMin: 200, compMax: 300, priority: "medium", tier: 2, status: "saved", interviews: 0, website: "https://vercel.com" },
  { id: "6", company: "Linear", role: "Business Development Lead", location: "San Francisco, CA", fitScore: 75, compMin: 180, compMax: 260, priority: "medium", tier: 2, status: "saved", interviews: 0, website: "https://linear.app" },
  { id: "7", company: "Plaid", role: "Partner Development Manager", location: "San Francisco, CA", fitScore: 72, compMin: 200, compMax: 280, priority: "low", tier: 2, status: "rejected", interviews: 2, website: "https://plaid.com" },
  { id: "8", company: "Ramp", role: "Director of Strategic Partnerships", location: "New York, NY", fitScore: 90, compMin: 260, compMax: 380, priority: "high", tier: 1, status: "offer", interviews: 4, website: "https://ramp.com" },
  { id: "9", company: "Scale AI", role: "Enterprise Partnerships Lead", location: "San Francisco, CA", fitScore: 82, compMin: 240, compMax: 340, priority: "medium", tier: 1, status: "applied", interviews: 0, website: "https://scale.com" },
  { id: "10", company: "Watershed", role: "Head of BD", location: "San Francisco, CA", fitScore: null, compMin: 200, compMax: 280, priority: "low", tier: 3, status: "withdrawn", interviews: 1, website: "https://watershed.com" },
];

const DEMO_UPCOMING = [
  { id: "u1", company: "Stripe", round: "Hiring Manager — VP Partnerships", dateTime: new Date(Date.now() + 2 * 86400000).toISOString() },
  { id: "u2", company: "Figma", round: "Case Study Presentation", dateTime: new Date(Date.now() + 5 * 86400000).toISOString() },
];

const DEMO_ACTIVITY = [
  { id: "a1", description: "Completed panel interview with Stripe partnerships team", company: "Stripe", role: "Head of Strategic Partnerships", date: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: "a2", description: "Received offer from Ramp — $320K base + equity", company: "Ramp", role: "Director of Strategic Partnerships", date: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: "a3", description: "Applied with tailored resume and cover letter", company: "Notion", role: "Strategic Partnerships Lead", date: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: "a4", description: "Completed recruiter screen — strong culture fit signal", company: "Figma", role: "Director of Business Development", date: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: "a5", description: "AI-generated interview prep reviewed and customized", company: "Stripe", role: "Head of Strategic Partnerships", date: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: "a6", description: "Rejected after final round — feedback: wanted more SaaS experience", company: "Plaid", role: "Partner Development Manager", date: new Date(Date.now() - 7 * 86400000).toISOString() },
];

const DEMO_FOLLOWUPS = [
  { id: "f1", company: "Scale AI", role: "Enterprise Partnerships Lead", daysSinceActivity: 6 },
];

export default function DemoPage() {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const stats = {
    total: DEMO_OPPS.length,
    interviewing: DEMO_OPPS.filter((o) => o.status === "interviewing").length,
    upcoming: DEMO_UPCOMING.length,
  };

  const grouped = COLUMNS.map((col) => ({
    ...col,
    items: DEMO_OPPS.filter((o) => o.status === col.status),
  }));

  return (
    <div className="min-h-screen bg-warm-100">
      {/* Demo banner */}
      <div className="bg-terracottacotta/10 border-b border-transparent px-4 py-2.5 text-center">
        <p className="text-xs text-terracottacotta-deep">
          This is a demo with sample data.{" "}
          <Link href="/login" className="font-semibold underline underline-offset-2 hover:text-terracotta">
            Sign up free
          </Link>{" "}
          to start tracking your own pipeline.
        </p>
      </div>

      {/* Header */}
      <header className="border-b border-transparent px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between bg-warm-50/80 backdrop-blur-sm sticky top-0 z-10 animate-fade-in">
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-semibold text-warm-900 tracking-tight">
            Interview Tracker
          </h1>
          <p className="text-[10px] sm:text-xs text-warm-600 mt-0.5">
            {stats.total} opps · {stats.interviewing} active · {stats.upcoming} upcoming
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-xs sm:text-sm text-warm-700">Demo User</span>
          <Link
            href="/login"
            className="px-3 py-1.5 text-xs font-medium bg-terracottacotta hover:bg-terracottacotta-deep text-white rounded-lg shadow-card hover:shadow-glow hover:-translate-y-px transition-all duration-200"
          >
            Sign up free
          </Link>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row">
        {/* Main content — Kanban */}
        <main className="flex-1 p-4 sm:p-6 overflow-x-auto animate-fade-in-up">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-warm-600 uppercase tracking-wider">
                Pipeline
              </h2>
            </div>

            {/* Kanban columns */}
            <div className="flex gap-3 sm:gap-4 min-h-[50vh] sm:min-h-[calc(100vh-280px)] overflow-x-auto pb-4 -mx-2 px-2">
              {grouped.map((col) => (
                <div
                  key={col.status}
                  className={`flex-1 min-w-[160px] sm:min-w-[220px] flex flex-col rounded-xl ${col.bg}`}
                >
                  {/* Column header */}
                  <div className="p-3 flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: col.color }}
                    />
                    <span className="text-xs font-medium text-warm-700 uppercase tracking-wider">
                      {col.label}
                    </span>
                    <span className="text-xs text-warm-500 ml-auto">
                      {col.items.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 px-2 pb-2 space-y-2 stagger-children">
                    {col.items.map((opp) => (
                      <div
                        key={opp.id}
                        onClick={() => setExpandedCard(expandedCard === opp.id ? null : opp.id)}
                        className={`group bg-vellum-lowest border-l-[3px] ${PRIORITY_BORDER[opp.priority] || "border-l-warm-300"} rounded-xl p-3 cursor-pointer shadow-card hover:shadow-card-hover hover:border-warm-400/80 hover:-translate-y-0.5 transition-all duration-200`}
                      >
                        <div className="flex items-start gap-2.5">
                          <DemoCompanyAvatar company={opp.company} website={opp.website} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <h3 className="text-sm font-medium text-warm-900 truncate">
                                {opp.company}
                              </h3>
                              {opp.priority && (
                                <span
                                  className={`text-xs shrink-0 ${
                                    opp.priority === "high"
                                      ? "text-terracotta"
                                      : opp.priority === "low"
                                      ? "text-warm-400"
                                      : "text-warm-500"
                                  }`}
                                  title={`${opp.priority} priority`}
                                >
                                  {PRIORITY_ICONS[opp.priority] || ""}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-warm-600 truncate mt-0.5">
                              {opp.role}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {opp.fitScore != null && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-terracottacotta/10 text-terracotta border border-transparent">
                              {opp.fitScore}%
                            </span>
                          )}
                          {opp.tier != null && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-warm-200 text-warm-700 border border-warm-300">
                              T{opp.tier}
                            </span>
                          )}
                          {opp.interviews > 0 && (
                            <span className="text-[10px] text-warm-500">
                              {opp.interviews} int.
                            </span>
                          )}
                        </div>

                        {opp.compMin != null && opp.compMax != null && (
                          <p className="text-[10px] text-warm-500 mt-1.5">
                            ${opp.compMin}K – ${opp.compMax}K
                          </p>
                        )}

                        {opp.location && (
                          <p className="text-[10px] text-warm-500 mt-0.5 truncate">
                            {opp.location}
                          </p>
                        )}

                        {/* Expanded detail preview */}
                        {expandedCard === opp.id && (
                          <div className="mt-3 pt-3 border-t border-warm-200 space-y-2 animate-fade-in">
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div>
                                <span className="text-warm-400">Priority</span>
                                <p className="text-warm-700 capitalize">{opp.priority}</p>
                              </div>
                              <div>
                                <span className="text-warm-400">Tier</span>
                                <p className="text-warm-700">{opp.tier}</p>
                              </div>
                            </div>
                            <p className="text-[10px] text-terracotta italic">
                              Sign up to see full details, AI prep, and more
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Right sidebar */}
        <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-transparent p-4 sm:p-5 space-y-6 shrink-0 bg-warm-50/80 backdrop-blur-sm animate-slide-in-right">
          {/* Upcoming Interviews */}
          <div>
            <h2 className="text-xs font-medium text-warm-600 uppercase tracking-wider mb-3">
              Upcoming Interviews
            </h2>
            <div className="space-y-2">
              {DEMO_UPCOMING.map((interview) => (
                <div
                  key={interview.id}
                  className="bg-white/80 border border-transparent rounded-lg p-3 shadow-card"
                >
                  <p className="text-sm text-warm-900 font-medium">{interview.company}</p>
                  <p className="text-xs text-warm-600">{interview.round}</p>
                  <p className="text-xs text-terracottacotta-soft mt-1">
                    {new Date(interview.dateTime).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Overdue Follow-ups */}
          {DEMO_FOLLOWUPS.length > 0 && (
            <div>
              <h2 className="text-xs font-medium text-terracotta uppercase tracking-wider mb-3">
                Needs Follow-up
              </h2>
              <div className="space-y-2">
                {DEMO_FOLLOWUPS.map((item) => (
                  <div
                    key={item.id}
                    className="bg-terracottacotta/5 border border-terra/15 rounded-lg p-3"
                  >
                    <p className="text-sm text-warm-900 font-medium">{item.company}</p>
                    <p className="text-xs text-warm-600">{item.role}</p>
                    <p className="text-xs text-terracotta mt-1">
                      {item.daysSinceActivity} days since last activity
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div>
            <h2 className="text-xs font-medium text-warm-600 uppercase tracking-wider mb-3">
              Recent Activity
            </h2>
            <div className="space-y-2">
              {DEMO_ACTIVITY.map((activity) => (
                <div key={activity.id} className="flex items-start gap-2 text-xs">
                  <span className="text-warm-500 shrink-0 w-14">
                    {new Date(activity.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <div>
                    <span className="text-warm-800">{activity.description}</span>
                    <span className="text-warm-500 block">
                      {activity.company} — {activity.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-terracottacotta/5 border border-transparent rounded-xl p-4 text-center">
            <p className="text-sm font-medium text-warm-900 mb-1">Ready to track your pipeline?</p>
            <p className="text-xs text-warm-600 mb-3">AI-powered prep, debrief capture, comp comparison, and more.</p>
            <Link
              href="/login"
              className="inline-block px-4 py-2 text-xs font-medium bg-terracottacotta hover:bg-terracottacotta-deep text-white rounded-lg shadow-card hover:shadow-glow hover:-translate-y-px transition-all duration-200"
            >
              Get started free
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
