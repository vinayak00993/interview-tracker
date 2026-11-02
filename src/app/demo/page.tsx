import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LinkButton, Card } from "@/components/ui";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";
import { DEMO_OPPORTUNITIES, DEMO_UPCOMING, DEMO_FOLLOWUPS, DEMO_ACTIVITY } from "@/lib/demo-data";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Demo",
  description: "A sample pipeline showing how Interview Tracker works.",
};

export default function DemoPage() {
  const stats = {
    total: DEMO_OPPORTUNITIES.length,
    interviewing: DEMO_OPPORTUNITIES.filter((o) => o.status === "interviewing").length,
    offers: DEMO_OPPORTUNITIES.filter((o) => o.status === "offer").length,
  };

  return (
    <div className="min-h-screen bg-vellum">
      <div className="bg-terracotta/10 px-4 py-2.5 text-center">
        <p className="text-xs text-terracotta-deep">
          This is a demo with sample data.{" "}
          <Link href="/login" className="font-semibold underline underline-offset-2 hover:text-terracotta">
            Sign up free
          </Link>{" "}
          to track your own pipeline.
        </p>
      </div>

      <header className="manuscript-glass sticky top-0 z-20">
        <div className="px-4 sm:px-8 lg:px-12 h-14 sm:h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <Logo size={26} wordmark className="hidden sm:inline-flex" />
            <Logo size={26} className="sm:hidden" />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/demo/offers" className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-label text-ink-700 hover:text-terracotta hover:bg-vellum-high rounded transition-all">
              Offers demo
            </Link>
            <LinkButton href="/login" variant="primary" size="sm">
              Sign up free
            </LinkButton>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-vellum-high to-transparent" />
      </header>

      <div className="flex flex-col lg:flex-row">
        <main className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 py-6 sm:py-8 animate-fade-in-up">
          <PipelineBoard opportunities={DEMO_OPPORTUNITIES} readOnly />
        </main>

        <aside className="w-full lg:w-80 xl:w-96 bg-vellum-low lg:sticky lg:top-16 lg:self-start lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto px-4 sm:px-8 py-6 sm:py-8 space-y-8 shrink-0 animate-slide-in-right">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Tracked" value={stats.total} />
            <Stat label="Active" value={stats.interviewing} accent />
            <Stat label="Offers" value={stats.offers} />
          </div>

          <section>
            <h2 className="manuscript-label mb-3 flex items-center justify-between">
              <span>Upcoming</span>
              <span className="text-terracotta">{DEMO_UPCOMING.length}</span>
            </h2>
            <div className="space-y-2">
              {DEMO_UPCOMING.map((i) => (
                <div key={i.id} className="bg-vellum-lowest rounded px-3 py-2.5 shadow-card">
                  <p className="text-sm text-ink-900 font-serif font-medium leading-tight">{i.company}</p>
                  <p className="text-[11px] text-ink-600 mt-0.5">{i.round}</p>
                  <p className="text-[10px] uppercase tracking-label text-terracotta mt-1.5 font-medium">{formatDate(i.dateTime, "long")}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="manuscript-label mb-3 text-terracotta">Needs a follow-up</h2>
            <div className="space-y-2">
              {DEMO_FOLLOWUPS.map((f) => (
                <div key={f.id} className="bg-terracotta/5 rounded px-3 py-2.5">
                  <p className="text-sm text-ink-900 font-serif font-medium leading-tight">{f.company}</p>
                  <p className="text-[11px] text-ink-600 mt-0.5">{f.role}</p>
                  <p className="text-[10px] uppercase tracking-label text-terracotta mt-1.5 font-medium">Quiet for {f.daysSinceActivity} days</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="manuscript-label mb-3">Recent activity</h2>
            <div className="space-y-2.5">
              {DEMO_ACTIVITY.map((a) => (
                <div key={a.id} className="flex items-start gap-3 text-xs">
                  <span className="text-[10px] uppercase tracking-label text-ink-600 shrink-0 w-12 pt-0.5 font-medium">{formatDate(a.date)}</span>
                  <div className="min-w-0">
                    <span className="text-ink-900 font-serif leading-snug block">{a.description}</span>
                    <span className="text-ink-600 text-[11px] block mt-0.5">
                      {a.company} · {a.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Card tone="accent" className="text-center">
            <p className="font-serif font-medium text-ink-900">Ready to track your own pipeline?</p>
            <p className="text-xs text-ink-700 mt-1.5">Round-specific prep, debriefs, follow-ups and offer comparison.</p>
            <div className="mt-4 flex justify-center">
              <LinkButton href="/login" variant="primary" size="sm">
                Get started free
              </LinkButton>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="bg-vellum-lowest rounded px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-label text-ink-600 font-semibold">{label}</p>
      <p className={`manuscript-display text-2xl leading-none mt-1 ${accent ? "text-terracotta" : "text-ink-900"}`}>{value}</p>
    </div>
  );
}
