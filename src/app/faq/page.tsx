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
    <div className="min-h-screen bg-warm-100">
      <header className="border-b border-warm-300/60 px-6 py-3 flex items-center gap-4 bg-warm-50/80 backdrop-blur-sm sticky top-0 z-10">
        <Link
          href="/dashboard"
          className="text-xs font-medium text-warm-600 hover:text-warm-900 bg-warm-100/80 hover:bg-warm-200 px-3 py-1.5 rounded-lg border border-warm-300/60 hover:border-warm-400 shadow-card hover:shadow-card-hover hover:-translate-y-px transition-all duration-200"
        >
          ← Dashboard
        </Link>
        <div className="h-4 w-px bg-warm-300" />
        <span className="text-xs text-warm-600">FAQ</span>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 animate-fade-in-up">
        <h1 className="text-2xl font-semibold text-warm-900 mb-2">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-warm-500 mb-10">
          Everything you need to know about Interview Tracker.
        </p>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white/80 backdrop-blur-sm border border-warm-300/60 rounded-xl overflow-hidden shadow-card"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left gap-4 hover:bg-warm-50/60 transition-colors"
              >
                <span className="text-sm font-medium text-warm-900">
                  {faq.q}
                </span>
                <span
                  className="text-warm-400 text-xs shrink-0 transition-transform duration-200"
                  style={{
                    transform: open === i ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                >
                  ▼
                </span>
              </button>
              {open === i && (
                <div className="px-5 pb-5">
                  <p className="text-sm text-warm-700 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="mt-12 text-xs text-warm-400 text-center">
          Still have questions?{" "}
          <a
            href="mailto:vinayak009@gmail.com"
            className="text-terra hover:text-terra-light transition-colors"
          >
            Get in touch
          </a>
        </p>
      </div>
    </div>
  );
}
