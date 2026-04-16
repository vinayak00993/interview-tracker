import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Interview Tracker",
  description: "How Interview Tracker handles your data.",
};

export default function PrivacyPage() {
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
          <span className="text-[11px] font-semibold uppercase tracking-label text-ink-600">Privacy</span>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-vellum-high to-transparent" />
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-10 lg:px-16 py-12 sm:py-16">
        <p className="manuscript-label">Privacy Policy</p>
        <h1 className="manuscript-display text-3xl sm:text-4xl font-semibold text-ink-900 mt-1 leading-tight">
          How we handle your data
        </h1>
        <p className="text-sm text-ink-600 mt-3">Last updated: April 16, 2026</p>

        <div className="mt-10 space-y-8 text-sm text-ink-800 leading-relaxed">
          <section>
            <h2 className="text-base font-serif font-semibold text-ink-900 mb-2">What we collect</h2>
            <p>
              Interview Tracker is a personal productivity tool. We collect only the data
              required to run it:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Your name and email address (to identify your account)</li>
              <li>Opportunities, interviews, contacts, notes, and activity you enter yourself</li>
              <li>Resume text and LinkedIn summary you upload to generate AI prep</li>
              <li>If you sign in with Google: your Google profile ID, name, email, and profile picture</li>
              <li>If you connect Google Calendar: read-only access to your calendar events, used to identify interview meetings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-serif font-semibold text-ink-900 mb-2">How Google user data is used</h2>
            <p>
              When you sign in with Google or connect your calendar, Interview Tracker
              accesses your Google account data strictly for the following purposes:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Identity</strong>: your name, email, and profile picture are used to create and identify your account.</li>
              <li><strong>Calendar (read-only)</strong>: upcoming calendar events are read to surface interview meetings and pre-generate AI preparation material.</li>
            </ul>
            <p className="mt-3">
              We do <strong>not</strong> sell your data, share it with third parties for
              advertising, or use it to train AI models. Google user data is not transferred
              to any third party other than the AI provider (Anthropic) that powers prep
              generation — and in that case, only the specific opportunity context
              (company, role, JD) plus your uploaded resume text is sent, never raw
              calendar events.
            </p>
            <p className="mt-3">
              Interview Tracker&apos;s use of information received from Google APIs adheres to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-terracotta hover:text-terracotta-deep underline underline-offset-2"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
          </section>

          <section>
            <h2 className="text-base font-serif font-semibold text-ink-900 mb-2">Where your data lives</h2>
            <p>
              Data is stored in a secure SQLite database (Turso) with encrypted
              connections. Only you can access data tied to your account. Session
              tokens are signed with industry-standard JWT and transmitted only
              over HTTPS.
            </p>
          </section>

          <section>
            <h2 className="text-base font-serif font-semibold text-ink-900 mb-2">AI processing</h2>
            <p>
              When you request AI prep generation, we send your resume text, LinkedIn
              summary, the target role details, and any prior interview debriefs to
              Anthropic&apos;s Claude API. Anthropic does not train on API inputs. See
              the{" "}
              <a
                href="https://www.anthropic.com/legal/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-terracotta hover:text-terracotta-deep underline underline-offset-2"
              >
                Anthropic privacy policy
              </a>{" "}
              for details.
            </p>
          </section>

          <section>
            <h2 className="text-base font-serif font-semibold text-ink-900 mb-2">Your controls</h2>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Export all your data at any time from the dashboard (CSV or JSON).</li>
              <li>Delete your account and all associated data at any time — email support@interviewtracker.app.</li>
              <li>Disconnect your Google account and revoke calendar access from your{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-terracotta hover:text-terracotta-deep underline underline-offset-2"
                >
                  Google Account permissions page
                </a>.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-serif font-semibold text-ink-900 mb-2">Contact</h2>
            <p>
              Questions or concerns: <a href="mailto:support@interviewtracker.app" className="text-terracotta hover:text-terracotta-deep underline underline-offset-2">support@interviewtracker.app</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
