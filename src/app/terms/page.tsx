import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Interview Tracker",
  description: "Terms of use for Interview Tracker.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-vellum">
      <header className="manuscript-glass sticky top-0 z-20">
        <div className="px-4 sm:px-10 lg:px-16 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="text-[11px] font-semibold uppercase tracking-label text-ink-700 hover:text-terracotta hover:bg-vellum-high px-3 py-1.5 rounded transition-all"
          >
            ← Home
          </Link>
          <span className="text-ink-400">/</span>
          <span className="text-[11px] font-semibold uppercase tracking-label text-ink-600">Terms</span>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-vellum-high to-transparent" />
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-10 lg:px-16 py-12 sm:py-16">
        <p className="manuscript-label">Terms of Service</p>
        <h1 className="manuscript-display text-3xl sm:text-4xl font-semibold text-ink-900 mt-1 leading-tight">
          Terms of Service
        </h1>
        <p className="text-sm text-ink-600 mt-3">Last updated: April 16, 2026</p>

        <div className="mt-10 space-y-8 text-sm text-ink-800 leading-relaxed">
          <section>
            <h2 className="text-base font-serif font-semibold text-ink-900 mb-2">The short version</h2>
            <p>
              Interview Tracker is a personal tool provided as-is. Use it to track
              your job search. Don&apos;t abuse it, don&apos;t use it to harm others,
              and understand that it&apos;s a small independent product with no
              uptime guarantees.
            </p>
          </section>

          <section>
            <h2 className="text-base font-serif font-semibold text-ink-900 mb-2">Acceptable use</h2>
            <p>
              You agree not to: reverse-engineer the service, abuse the AI features
              (attempting to generate content unrelated to job search), upload
              content you don&apos;t have the right to use, or attempt to access
              data belonging to other users.
            </p>
          </section>

          <section>
            <h2 className="text-base font-serif font-semibold text-ink-900 mb-2">Your content</h2>
            <p>
              Everything you put into Interview Tracker — your opportunities, notes,
              resume, interview debriefs — remains yours. We claim no ownership.
              Exporting or deleting your data is always available.
            </p>
          </section>

          <section>
            <h2 className="text-base font-serif font-semibold text-ink-900 mb-2">Availability</h2>
            <p>
              The service is provided &quot;as is&quot; with no warranty of uptime,
              completeness, or fitness for purpose. AI-generated content is a
              suggestion, not advice — double-check before acting on it in a
              real interview.
            </p>
          </section>

          <section>
            <h2 className="text-base font-serif font-semibold text-ink-900 mb-2">Changes</h2>
            <p>
              Terms may be updated from time to time. Material changes will be
              announced on the dashboard. Continued use after changes means you
              accept the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-serif font-semibold text-ink-900 mb-2">Contact</h2>
            <p>
              Questions: <a href="mailto:support@interviewtracker.app" className="text-terracotta hover:text-terracotta-deep underline underline-offset-2">support@interviewtracker.app</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
