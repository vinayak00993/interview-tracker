import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { Logo } from "@/components/Logo";

export const metadata = {
  title: "Guide — Interview Tracker",
};

const SECTIONS = [
  {
    id: "pipeline",
    label: "01 · The Pipeline",
    title: "Track every pursuit on one board",
    body: [
      "The dashboard is a kanban board with six columns: Saved, Applied, Interviewing, Offer, Archived (rejected), and Withdrawn. Each card is one opportunity — a role at a company.",
      "Drag a card between columns to change its status. The change is saved instantly and recorded in that opportunity's activity timeline, so you always have an audit trail of when you applied and when things moved.",
    ],
    tips: [
      "Use priority (high / medium / low) and tier (I–III) to mark which roles matter most — both are filterable from the toolbar.",
      "The search bar matches company, role, and location.",
      "\"Hide Salary\" tucks comp figures away when you're screen-sharing.",
    ],
  },
  {
    id: "adding",
    label: "02 · Adding Opportunities",
    title: "Paste a link — or a screenshot",
    body: [
      "Click + New Entry on the dashboard. You can fill the form by hand, but there are two faster paths:",
      "Auto-fill from URL: paste the job posting link and hit Auto-fill. The listing is scraped and company, role, location, and comp range are extracted for you.",
      "Screenshot OCR: drop, paste, or upload screenshots of a job description (useful for LinkedIn or PDFs) and the same fields are read straight out of the image with AI vision.",
    ],
    tips: [
      "Always review auto-filled comp figures — postings are inconsistent about ranges.",
      "Add the company website if it isn't detected; it powers the company logo on the card.",
    ],
  },
  {
    id: "profile",
    label: "03 · Your Profile",
    title: "Upload your resume once, reuse it everywhere",
    body: [
      "Head to Profile and upload your resume as .docx or .txt (or paste the text directly), plus your LinkedIn about section if you like.",
      "This is the foundation of every AI feature: prep generation reads your actual background so it can map your experience to the role's requirements and flag your gaps honestly.",
    ],
    tips: [
      "Keep the resume current — AI prep is only as good as what it knows about you.",
    ],
  },
  {
    id: "interviews",
    label: "04 · Interviews & AI Prep",
    title: "Log rounds, generate tailored prep",
    body: [
      "Open any opportunity and switch to the Interviews tab to log a round: name (e.g. Recruiter Screen, Hiring Manager, Panel), date and time, format, and interviewer details.",
      "From the Prep tab, generate AI interview prep. It combines your resume, the job description, and — crucially — debriefs from earlier rounds at that company, so a round-3 prep knows what happened in rounds 1 and 2.",
      "Upcoming interviews appear in the dashboard sidebar so nothing sneaks up on you.",
    ],
    tips: [
      "Add the interviewer's LinkedIn when you have it — knowing your audience changes how you frame answers.",
      "Prep notes support Markdown, so the generated prep stays readable.",
    ],
  },
  {
    id: "debriefs",
    label: "05 · Debriefs",
    title: "Write it down while it's fresh",
    body: [
      "Right after each interview, open the round and capture a debrief: how it went, what they asked, and a sentiment (positive / neutral / negative).",
      "Debriefs are not just a diary — they feed back into future AI prep, and the questions you were asked become a growing bank of what this company (and others) care about.",
    ],
    tips: [
      "Record the stated next steps — the dashboard flags opportunities that have gone quiet for 5+ days so you know when to follow up.",
    ],
  },
  {
    id: "comp",
    label: "06 · Comp & Offers",
    title: "Compare everything side by side",
    body: [
      "The Compensation view charts the salary ranges of every opportunity in your pipeline on one horizontal bar chart — instantly showing which roles are worth the effort.",
      "When offers arrive, the Offers view breaks each one down: base, bonus, equity and vesting, PTO, remote policy. Paste the offer letter and the numbers are extracted for you.",
    ],
    tips: [
      "Multiple offers are leverage. Having every number in one table is how you negotiate from strength.",
    ],
  },
  {
    id: "data",
    label: "07 · Your Data",
    title: "Export any time",
    body: [
      "Everything you enter is yours. The Export link in the header downloads your full pipeline as CSV (or JSON via /api/export?format=json) whenever you want it.",
    ],
    tips: [],
  },
];

export default async function GuidePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-vellum">
      {/* Header */}
      <header className="manuscript-glass sticky top-0 z-20 animate-fade-in">
        <div className="px-4 sm:px-10 lg:px-16 py-4 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Logo size={26} className="shrink-0" />
            <div className="min-w-0">
              <h1 className="manuscript-display text-xl sm:text-2xl font-semibold text-ink-900 leading-tight truncate">
                The Guide
              </h1>
              <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-label text-ink-600 mt-0.5">
                How to run your search here
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-label text-ink-700 hover:text-terracotta hover:bg-vellum-high rounded transition-all whitespace-nowrap"
          >
            ← Back to Pipeline
          </Link>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-vellum-high to-transparent" />
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-10 sm:py-14 animate-fade-in-up">
        {/* Intro */}
        <div className="mb-12">
          <p className="manuscript-label text-terracotta">The Workflow</p>
          <h2 className="manuscript-display text-3xl sm:text-4xl font-semibold text-ink-900 mt-2 leading-tight">
            Prep smarter, debrief faster, land the role.
          </h2>
          <p className="text-sm sm:text-base text-ink-700 mt-4 leading-relaxed font-serif">
            The rhythm is simple: <em>save</em> roles as you find them, <em>enrich</em> them with a
            resume-aware profile, <em>prep</em> with AI before each round, <em>debrief</em> right after,
            and let the pipeline views tell you where to spend your energy. This page walks through
            each piece.
          </p>
        </div>

        {/* Table of contents */}
        <nav className="mb-12 bg-vellum-lowest rounded-lg p-5 shadow-card">
          <p className="manuscript-label mb-3">Contents</p>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-sm font-serif text-ink-700 hover:text-terracotta transition-colors"
                >
                  {s.label.split("·")[1].trim()}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Sections */}
        <div className="space-y-12">
          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <p className="manuscript-label text-terracotta">{section.label}</p>
              <h3 className="manuscript-display text-xl sm:text-2xl font-semibold text-ink-900 mt-1.5 leading-tight">
                {section.title}
              </h3>
              <div className="mt-3 space-y-3">
                {section.body.map((para, i) => (
                  <p key={i} className="text-sm text-ink-700 leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
              {section.tips.length > 0 && (
                <div className="mt-4 bg-vellum-low rounded p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-label text-ink-600 mb-2">
                    Worth knowing
                  </p>
                  <ul className="space-y-1.5">
                    {section.tips.map((tip, i) => (
                      <li key={i} className="text-[13px] text-ink-700 font-serif leading-snug flex gap-2">
                        <span className="text-terracotta shrink-0">·</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-14 text-center bg-vellum-lowest rounded-lg p-8 shadow-card">
          <p className="manuscript-display text-lg font-semibold text-ink-900">
            Ready to put it to work?
          </p>
          <Link
            href="/dashboard"
            className="inline-block mt-4 px-6 py-2.5 text-[11px] font-semibold uppercase tracking-label bg-terracotta hover:bg-terracotta-deep text-vellum rounded shadow-card hover:shadow-lift hover:-translate-y-0.5 transition-all"
          >
            Back to the Pipeline
          </Link>
        </div>
      </main>
    </div>
  );
}
