import type { Metadata } from "next";
import { PublicShell, PublicArticle } from "@/components/marketing/PublicShell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of use for Interview Tracker.",
};

export default function TermsPage() {
  return (
    <PublicShell crumb="Terms">
      <PublicArticle eyebrow="Terms of Service" title="Terms of Service" intro={<p className="text-sm text-ink-600">Last updated: April 16, 2026</p>}>
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
              Everything you put into Interview Tracker (your opportunities, notes,
              resume, and interview debriefs) remains yours. We claim no ownership.
              Exporting or deleting your data is always available.
            </p>
          </section>

          <section>
            <h2 className="text-base font-serif font-semibold text-ink-900 mb-2">Availability</h2>
            <p>
              The service is provided &quot;as is&quot; with no warranty of uptime,
              completeness, or fitness for purpose. AI-generated content is a
              suggestion, not advice. Double check it before acting on it in a
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
      </PublicArticle>
    </PublicShell>
  );
}
