import Link from "next/link";
import { LinkButton } from "@/components/ui";
import { PrepMock, DebriefMock, OffersMock } from "./FeatureMocks";

export function Hero() {
  return (
    <section className="px-4 sm:px-8 lg:px-12 pt-14 sm:pt-20 pb-10 sm:pb-14 max-w-5xl mx-auto animate-fade-in-up">
      <p className="manuscript-label">Interview intelligence</p>
      <h1 className="manuscript-display text-4xl sm:text-5xl lg:text-[4rem] font-semibold text-ink-900 leading-[1.02] tracking-tight mt-3 max-w-3xl">
        Prep smarter. Debrief faster. Land the role.
      </h1>
      <p className="text-base sm:text-lg font-serif text-ink-700 mt-5 max-w-2xl leading-relaxed">
        Interview Tracker holds every opportunity in one pipeline, writes prep for each specific round from your resume and your own debriefs, and compares offers on what they actually pay.
      </p>
      <div className="flex flex-wrap items-center gap-3 mt-7">
        <LinkButton href="/login" variant="primary" className="px-5 py-3">
          Start tracking
        </LinkButton>
        <LinkButton href="/demo" variant="ghost" className="px-5 py-3">
          See the demo →
        </LinkButton>
      </div>
      <p className="text-[11px] uppercase tracking-label text-ink-600 mt-5">Free. Your data stays yours. Export any time.</p>
    </section>
  );
}

export function BoardFrame({ children }: { children: React.ReactNode }) {
  return (
    <section className="px-4 sm:px-8 lg:px-12 pb-16 sm:pb-24 max-w-7xl mx-auto">
      <div className="rounded-xl bg-vellum-low p-3 sm:p-5 shadow-elevated">
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="manuscript-label">Live preview · sample pipeline</p>
          <Link href="/demo" className="text-[10px] font-semibold uppercase tracking-label text-terracotta hover:text-terracotta-deep">
            Open the full demo →
          </Link>
        </div>
        <div className="bg-vellum rounded-lg p-3 sm:p-5">{children}</div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    eyebrow: "Prep",
    title: "Round-specific prep that learns from your debriefs",
    body: "Each prep sheet is built for one round: the interviewer, the format, the job description, and everything earlier rounds taught you. A gap flagged in the recruiter screen is still open in the hiring manager prep until you close it.",
    mock: <PrepMock />,
  },
  {
    eyebrow: "Debrief",
    title: "Debrief in two minutes, draft the thank-you in one",
    body: "Log how it went, what they asked, and the sentiment while it is fresh. The follow-up email drafts itself from your notes and streams in as you watch, then saves with the round.",
    mock: <DebriefMock />,
  },
  {
    eyebrow: "Offers",
    title: "Compare offers on what they actually pay",
    body: "Paste the offer letter and the numbers get extracted into one table: base, bonus, equity per vesting year, benefits. The advisor reads your resume and the offers and tells you where each one wins and loses.",
    mock: <OffersMock />,
  },
];

export function Features() {
  return (
    <section className="px-4 sm:px-8 lg:px-12 pb-16 sm:pb-24 max-w-6xl mx-auto space-y-16 sm:space-y-24">
      {FEATURES.map((f, i) => (
        <div key={f.eyebrow} className={`grid gap-8 lg:gap-14 lg:grid-cols-2 items-center ${i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}>
          <div>
            <p className="manuscript-label">{f.eyebrow}</p>
            <h2 className="manuscript-display text-2xl sm:text-3xl lg:text-[2.5rem] font-semibold text-ink-900 leading-tight mt-2">{f.title}</h2>
            <p className="text-base font-serif text-ink-700 mt-4 leading-relaxed max-w-lg">{f.body}</p>
          </div>
          <div className="max-w-md w-full lg:justify-self-center">{f.mock}</div>
        </div>
      ))}
    </section>
  );
}

const STEPS = [
  { n: "01", title: "Save the role", body: "Paste the posting link or a screenshot. Company, role, location and comp fill themselves." },
  { n: "02", title: "Prep each round", body: "Upload your resume once. Generate a sheet for every round, informed by every earlier debrief." },
  { n: "03", title: "Decide with numbers", body: "Debrief, follow up, and when offers land, compare them side by side with an advisor." },
];

export function HowItWorks() {
  return (
    <section className="bg-vellum-low">
      <div className="px-4 sm:px-8 lg:px-12 py-16 sm:py-20 max-w-6xl mx-auto">
        <p className="manuscript-label">How it works</p>
        <h2 className="manuscript-display text-2xl sm:text-3xl font-semibold text-ink-900 mt-2">Three habits, one place</h2>
        <ol className="grid gap-6 sm:grid-cols-3 mt-8">
          {STEPS.map((s) => (
            <li key={s.n} className="bg-vellum-lowest rounded-lg p-5 shadow-card">
              <p className="manuscript-display text-3xl text-terracotta leading-none">{s.n}</p>
              <h3 className="font-serif text-lg font-semibold text-ink-900 mt-3">{s.title}</h3>
              <p className="text-sm text-ink-700 mt-2 leading-relaxed">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const FAQ = [
  { q: "Is my data private?", a: "Yes. It is tied to your account, never shared, never sold, never used to train models." },
  { q: "What does the AI actually see?", a: "Your resume, the role, the posting, and your own debriefs. Nothing else, and only when you ask for prep or a draft." },
  { q: "Does it work on a phone?", a: "Yes. The pipeline, debriefs and prep are all usable one-handed. Long notes are easier at a desk." },
];

export function FaqTeaser() {
  return (
    <section className="px-4 sm:px-8 lg:px-12 py-16 sm:py-20 max-w-3xl mx-auto">
      <p className="manuscript-label">Questions</p>
      <h2 className="manuscript-display text-2xl sm:text-3xl font-semibold text-ink-900 mt-2">The short answers</h2>
      <dl className="mt-6 divide-y divide-vellum-high">
        {FAQ.map((f) => (
          <div key={f.q} className="py-4">
            <dt className="font-serif text-[15px] font-medium text-ink-900">{f.q}</dt>
            <dd className="text-sm text-ink-700 mt-1 leading-relaxed">{f.a}</dd>
          </div>
        ))}
      </dl>
      <Link href="/faq" className="inline-block mt-4 text-[11px] font-semibold uppercase tracking-label text-terracotta hover:text-terracotta-deep">
        Read the full FAQ →
      </Link>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="px-4 sm:px-8 lg:px-12 pb-20 sm:pb-28 max-w-3xl mx-auto text-center">
      <div className="bg-terracotta rounded-xl px-6 py-12 sm:py-16 text-vellum shadow-elevated">
        <p className="text-[11px] font-semibold uppercase tracking-label text-vellum/70">Ready when you are</p>
        <h2 className="manuscript-display text-3xl sm:text-4xl font-semibold leading-tight mt-3">Your next interview deserves a plan.</h2>
        <p className="font-serif text-vellum/85 mt-3 max-w-md mx-auto">Add your first opportunity in under a minute.</p>
        <div className="mt-7 flex justify-center">
          <Link href="/login" className="inline-flex items-center px-6 py-3 bg-vellum text-terracotta text-[11px] font-semibold uppercase tracking-label rounded shadow-card hover:-translate-y-0.5 hover:shadow-lift transition-all">
            Create your account
          </Link>
        </div>
      </div>
    </section>
  );
}
