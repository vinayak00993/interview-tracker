"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface OnboardingStatus {
  dismissed: boolean;
  hasOpportunity: boolean;
  hasResume: boolean;
  hasInterview: boolean;
  hasPrep: boolean;
  hasDebrief: boolean;
}

interface OnboardingGuideProps {
  status: OnboardingStatus;
  firstOpportunityId: string | null;
  userName: string | null;
}

const TOUR_SEEN_KEY = "it-tour-seen";

const TOUR_SLIDES = [
  {
    label: "Welcome",
    title: "Your job search, kept like a manuscript",
    body: "Interview Tracker holds every opportunity, interview, and offer in one place — so you always know where each pursuit stands and what to do next.",
    art: "◪",
  },
  {
    label: "The Pipeline",
    title: "Drag opportunities through six stages",
    body: "Every role you're pursuing is a card on the board: Saved, Applied, Interviewing, Offer, Archived, Withdrawn. Drag a card to a new column and its status — plus an activity log entry — updates automatically.",
    art: "⇄",
  },
  {
    label: "AI Prep",
    title: "Prep that knows your resume and the role",
    body: "Upload your resume once in Profile. Then, on any interview, generate AI prep tailored to your background, the job description, and how earlier rounds went.",
    art: "✦",
  },
  {
    label: "Debrief & Compare",
    title: "Capture debriefs, compare comp and offers",
    body: "After each round, log a quick debrief with sentiment — it sharpens future prep. As offers land, the Compensation and Offers views line everything up side by side.",
    art: "$",
  },
];

export default function OnboardingGuide({ status, firstOpportunityId, userName }: OnboardingGuideProps) {
  const router = useRouter();
  const [tourOpen, setTourOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const [hidden, setHidden] = useState(status.dismissed);
  const [dismissing, setDismissing] = useState(false);

  // Auto-open the tour once for brand-new accounts (nothing in the
  // pipeline yet, checklist not dismissed, tour not seen on this device).
  useEffect(() => {
    if (!status.dismissed && !status.hasOpportunity && !localStorage.getItem(TOUR_SEEN_KEY)) {
      setTourOpen(true);
    }
  }, [status.dismissed, status.hasOpportunity]);

  const closeTour = () => {
    localStorage.setItem(TOUR_SEEN_KEY, "1");
    setTourOpen(false);
    setSlide(0);
  };

  const openAddOpportunity = () => {
    window.dispatchEvent(new CustomEvent("open-add-opportunity"));
  };

  const dismissChecklist = async () => {
    setDismissing(true);
    setHidden(true);
    try {
      await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dismissed: true }),
      });
      router.refresh();
    } catch {
      // Leave it hidden for this render; server state will win on next load
    }
    setDismissing(false);
  };

  const steps = [
    {
      key: "opportunity",
      done: status.hasOpportunity,
      title: "Add your first opportunity",
      detail: "Paste a job posting URL or a screenshot and the fields fill themselves.",
      action: { label: "New entry", onClick: openAddOpportunity },
    },
    {
      key: "resume",
      done: status.hasResume,
      title: "Upload your resume",
      detail: "Powers AI prep tailored to your background. .docx or .txt.",
      action: { label: "Go to profile", href: "/profile" },
    },
    {
      key: "interview",
      done: status.hasInterview,
      title: "Log an interview round",
      detail: "Open an opportunity and add the round, date, and interviewer.",
      action: firstOpportunityId
        ? { label: "Open opportunity", href: `/opportunities/${firstOpportunityId}` }
        : null,
      locked: !status.hasOpportunity,
    },
    {
      key: "prep",
      done: status.hasPrep,
      title: "Generate AI interview prep",
      detail: "On any interview, one click drafts prep from your resume + the JD.",
      action: firstOpportunityId
        ? { label: "Open opportunity", href: `/opportunities/${firstOpportunityId}` }
        : null,
      locked: !status.hasInterview,
    },
    {
      key: "debrief",
      done: status.hasDebrief,
      title: "Capture a debrief",
      detail: "After the call, note how it went. Debriefs sharpen your next prep.",
      action: firstOpportunityId
        ? { label: "Open opportunity", href: `/opportunities/${firstOpportunityId}` }
        : null,
      locked: !status.hasInterview,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;
  const firstName = userName?.split(" ")[0] || null;

  return (
    <>
      {/* ── Getting-started checklist ── */}
      {!hidden && (
        <section className="mb-6 manuscript-glass bg-vellum-lowest/85 rounded-lg shadow-elevated animate-fade-in-up overflow-hidden">
          <div className="px-5 sm:px-6 pt-5 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="manuscript-label">Getting Started</p>
                <h2 className="manuscript-display text-lg sm:text-xl font-semibold text-ink-900 mt-0.5">
                  {allDone
                    ? "You're fully set up" + (firstName ? `, ${firstName}` : "")
                    : firstName
                      ? `Welcome, ${firstName} — set up your search`
                      : "Welcome — set up your search"}
                </h2>
              </div>
              <button
                type="button"
                onClick={dismissChecklist}
                disabled={dismissing}
                className="text-ink-600 hover:text-terracotta text-lg leading-none w-6 h-6 flex items-center justify-center shrink-0 transition-colors"
                aria-label="Dismiss getting started checklist"
                title="Dismiss — you can revisit everything in the Guide"
              >
                ×
              </button>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex-1 h-1.5 bg-vellum-high rounded-full overflow-hidden">
                <div
                  className="h-full bg-terracotta rounded-full transition-all duration-500"
                  style={{ width: `${(doneCount / steps.length) * 100}%` }}
                />
              </div>
              <span className="text-[10px] uppercase tracking-label text-ink-600 font-semibold shrink-0">
                {doneCount} of {steps.length}
              </span>
            </div>
          </div>

          {allDone ? (
            <div className="px-5 sm:px-6 pb-5">
              <p className="text-sm text-ink-700 font-serif italic">
                Every step complete — your pipeline is live. Dismiss this card whenever you like;
                the <Link href="/guide" className="text-terracotta underline underline-offset-2 not-italic font-medium">Guide</Link> is always in the header if you need a refresher.
              </p>
            </div>
          ) : (
            <ol className="px-5 sm:px-6 pb-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2.5">
              {steps.map((step, i) => (
                <li
                  key={step.key}
                  className={`rounded border p-3 transition-colors ${
                    step.done
                      ? "border-sage/30 bg-sage/5"
                      : step.locked
                        ? "border-vellum-high bg-vellum-low/50 opacity-60"
                        : "border-vellum-high bg-vellum-lowest"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5 ${
                        step.done ? "bg-sage text-vellum" : "bg-vellum-high text-ink-700"
                      }`}
                      aria-hidden="true"
                    >
                      {step.done ? "✓" : i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-[13px] font-serif font-medium leading-snug ${step.done ? "text-ink-600 line-through decoration-sage/50" : "text-ink-900"}`}>
                        {step.title}
                      </p>
                      <p className="text-[11px] text-ink-600 mt-1 leading-snug">{step.detail}</p>
                      {!step.done && !step.locked && step.action && (
                        step.action.href ? (
                          <Link
                            href={step.action.href}
                            className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-label text-terracotta hover:text-terracotta-deep transition-colors"
                          >
                            {step.action.label} →
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={step.action.onClick}
                            className="mt-2 text-[10px] font-semibold uppercase tracking-label text-terracotta hover:text-terracotta-deep transition-colors"
                          >
                            {step.action.label} →
                          </button>
                        )
                      )}
                      {step.locked && (
                        <p className="text-[10px] uppercase tracking-label text-ink-600 mt-2">
                          {step.key === "interview" ? "Add an opportunity first" : "Log an interview first"}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <div className="px-5 sm:px-6 py-2.5 bg-vellum-low/60 flex items-center justify-between">
            <button
              type="button"
              onClick={() => { setSlide(0); setTourOpen(true); }}
              className="text-[10px] font-semibold uppercase tracking-label text-ink-700 hover:text-terracotta transition-colors"
            >
              ▶ Replay the tour
            </button>
            <Link
              href="/guide"
              className="text-[10px] font-semibold uppercase tracking-label text-ink-700 hover:text-terracotta transition-colors"
            >
              Read the full guide →
            </Link>
          </div>
        </section>
      )}

      {/* ── Welcome tour modal ── */}
      {tourOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm animate-fade-in px-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeTour(); }}
          role="dialog"
          aria-modal="true"
          aria-label="Welcome tour"
        >
          <div className="w-full max-w-md bg-vellum-lowest rounded-lg shadow-elevated animate-scale-in overflow-hidden">
            {/* Slide art */}
            <div className="bg-vellum-low flex items-center justify-center py-10">
              <span className="text-5xl text-terracotta font-serif" aria-hidden="true">
                {TOUR_SLIDES[slide].art}
              </span>
            </div>

            <div className="px-7 py-6">
              <p className="manuscript-label text-terracotta">
                {TOUR_SLIDES[slide].label} · {slide + 1}/{TOUR_SLIDES.length}
              </p>
              <h3 className="manuscript-display text-xl font-semibold text-ink-900 mt-1.5 leading-tight">
                {TOUR_SLIDES[slide].title}
              </h3>
              <p className="text-sm text-ink-700 mt-2.5 leading-relaxed">
                {TOUR_SLIDES[slide].body}
              </p>

              {/* Dots */}
              <div className="flex items-center gap-1.5 mt-6">
                {TOUR_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSlide(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === slide ? "w-6 bg-terracotta" : "w-1.5 bg-vellum-high hover:bg-ink-400"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between mt-6">
                <button
                  type="button"
                  onClick={closeTour}
                  className="text-[11px] font-semibold uppercase tracking-label text-ink-600 hover:text-terracotta transition-colors"
                >
                  Skip
                </button>
                <div className="flex items-center gap-2">
                  {slide > 0 && (
                    <button
                      type="button"
                      onClick={() => setSlide(slide - 1)}
                      className="px-4 py-2 text-[11px] font-semibold uppercase tracking-label text-ink-700 hover:text-terracotta transition-colors"
                    >
                      Back
                    </button>
                  )}
                  {slide < TOUR_SLIDES.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setSlide(slide + 1)}
                      className="px-5 py-2 text-[11px] font-semibold uppercase tracking-label bg-terracotta hover:bg-terracotta-deep text-vellum rounded shadow-card transition-all"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { closeTour(); openAddOpportunity(); }}
                      className="px-5 py-2 text-[11px] font-semibold uppercase tracking-label bg-terracotta hover:bg-terracotta-deep text-vellum rounded shadow-card transition-all"
                    >
                      Add my first opportunity
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
