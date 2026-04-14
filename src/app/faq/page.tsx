"use client";

import { useState } from "react";
import Link from "next/link";

const faqs = [
  {
    q: "Is my data private? Can my employer see it?",
    a: "Completely private. Your job search data is tied to your account and never shared with anyone — not employers, not recruiters, not third parties. We don't sell data, period.",
  },
  {
    q: "Where is my data stored?",
    a: "Your data lives in a secure database and is only accessible through your account. You can export everything at any time from the dashboard, and delete your account whenever you want.",
  },
  {
    q: "What does AI prep actually do?",
    a: "When you add your resume and LinkedIn summary to your profile, the AI uses that context to generate tailored prep for each specific role — likely interview questions, talking points, gaps to address, and company research prompts. It's not generic; it's built around your background and the job description.",
  },
  {
    q: "What's the fit score?",
    a: "You set it — it's your own gut-check rating (0–100) of how well you match a role. Think of it as a quick signal for prioritization, not an automated score.",
  },
  {
    q: "What's the difference between Tier and Priority?",
    a: "Tier is about the company/role quality (Tier 1 = dream job, Tier 3 = backup). Priority is about how urgently you're pursuing it right now. A Tier 1 role might be low priority if you're waiting to hear back.",
  },
  {
    q: "Does it work on mobile?",
    a: "Yes — the interface is responsive. It's best on desktop for adding detailed notes, but you can check status, log activity, and review prep on your phone.",
  },
  {
    q: "How do I get the most out of it?",
    a: "Fill in your profile first (resume text + LinkedIn about section) — that's what unlocks the AI features. Then add your target roles and run AI prep before each interview round.",
  },
  { q: "Is it free?", a: "Yes." },
];

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-vellum">
      <header className="manuscript-glass sticky top-0 z-20">
        <div className="px-4 sm:px-10 lg:px-16 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-[11px] font-semibold uppercase tracking-label text-ink-700 hover:text-terracotta hover:bg-vellum-high px-3 py-1.5 rounded transition-all"
          >
            ← The Pipeline
          </Link>
          <span className="text-ink-400">/</span>
          <span className="text-[11px] font-semibold uppercase tracking-label text-ink-600">The Colophon</span>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-vellum-high to-transparent" />
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-10 lg:px-16 py-12 sm:py-16 animate-fade-in-up">
        <p className="manuscript-label">The Colophon</p>
        <h1 className="manuscript-display text-3xl sm:text-4xl font-semibold text-ink-900 mt-1 leading-tight">
          Frequently asked questions
        </h1>
        <p className="text-base font-serif italic text-ink-700 mt-3 mb-12">
          Everything you need to know about Interview Tracker.
        </p>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-vellum-lowest rounded overflow-hidden shadow-card hover-lift"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left gap-4 hover:bg-vellum-low transition-colors"
              >
                <span className="text-[15px] font-serif font-medium text-ink-900">
                  {faq.q}
                </span>
                <span
                  className="text-terracotta text-sm shrink-0 transition-transform duration-200"
                  style={{
                    transform: open === i ? "rotate(45deg)" : "rotate(0deg)",
                  }}
                >
                  +
                </span>
              </button>
              {open === i && (
                <div className="px-5 pb-5 pt-1">
                  <p className="text-sm text-ink-700 leading-relaxed font-serif">
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="mt-16 text-[11px] uppercase tracking-label text-ink-600 text-center">
          Still have questions?{" "}
          <a
            href="mailto:support@example.com"
            className="text-terracotta hover:text-terracotta-deep font-semibold underline underline-offset-2 transition-colors"
          >
            Get in touch
          </a>
        </p>
      </div>
    </div>
  );
}
