"use client";

import { useState } from "react";
import { PublicShell, PublicArticle } from "@/components/marketing/PublicShell";

const faqs = [
  {
    q: "Is my data private? Can my employer see it?",
    a: "Completely private. Your job search data is tied to your account and never shared with anyone. Not employers, not recruiters, not third parties. We don't sell data, period.",
  },
  {
    q: "Where is my data stored?",
    a: "Your data lives in a secure database and is only accessible through your account. You can export everything at any time from the dashboard, and delete your account whenever you want.",
  },
  {
    q: "What does AI prep actually do?",
    a: "When you add your resume and LinkedIn summary to your profile, the AI uses that context to generate prep for each specific interview round: likely questions, talking points tied to your actual experience, gaps to address, STAR stories, and research prompts. Earlier debriefs feed later rounds, so a gap flagged in the screen is still open in the hiring manager prep until you close it.",
  },
  {
    q: "What's the fit score?",
    a: "You set it yourself. It's your own gut check rating from 0 to 100 of how well you match a role. Think of it as a quick signal for prioritizing, not an automated score.",
  },
  {
    q: "What's the difference between Tier and Priority?",
    a: "Tier is about the company/role quality (Tier 1 = dream job, Tier 3 = backup). Priority is about how urgently you're pursuing it right now. A Tier 1 role might be low priority if you're waiting to hear back.",
  },
  {
    q: "Does it work on mobile?",
    a: "Yes. The pipeline, debriefs, prep sheets and follow-ups all work one-handed on a phone. Long notes are easier at a desk.",
  },
  {
    q: "How do I get the most out of it?",
    a: "Fill in your profile first (resume text and LinkedIn about section). That's what unlocks the AI features. Then add your target roles and run AI prep before each interview round.",
  },
  { q: "Is it free?", a: "Yes." },
];

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <PublicShell crumb="FAQ">
      <PublicArticle eyebrow="FAQ" title="Frequently asked questions" intro={<p className="text-base font-serif italic text-ink-700">Everything you need to know about Interview Tracker.</p>}>
        <div className="space-y-3 mt-10">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-vellum-lowest rounded overflow-hidden shadow-card hover-lift">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className="w-full flex items-center justify-between px-5 py-4 text-left gap-4 hover:bg-vellum-low transition-colors"
              >
                <span className="text-[15px] font-serif font-medium text-ink-900">{faq.q}</span>
                <span className="text-terracotta text-sm shrink-0 transition-transform duration-200" style={{ transform: open === i ? "rotate(45deg)" : "rotate(0deg)" }} aria-hidden="true">
                  +
                </span>
              </button>
              {open === i && (
                <div className="px-5 pb-5 pt-1">
                  <p className="text-sm text-ink-700 leading-relaxed font-serif">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="mt-16 text-[11px] uppercase tracking-label text-ink-600 text-center">
          Still have questions?{" "}
          <a href="mailto:support@interviewtracker.app" className="text-terracotta hover:text-terracotta-deep font-semibold underline underline-offset-2 transition-colors">
            Get in touch
          </a>
        </p>
      </PublicArticle>
    </PublicShell>
  );
}
