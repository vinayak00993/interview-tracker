import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LinkButton } from "@/components/ui";

/** Header and footer for signed-out pages. */
export function PublicShell({ children, crumb }: { children: React.ReactNode; crumb?: string }) {
  return (
    <div className="min-h-screen flex flex-col bg-vellum">
      <header className="manuscript-glass sticky top-0 z-20">
        <div className="px-4 sm:px-8 lg:px-12 h-14 sm:h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <Logo size={26} wordmark className="hidden sm:inline-flex" />
            <Logo size={26} className="sm:hidden" />
            {crumb && (
              <span className="sm:hidden text-[11px] font-semibold uppercase tracking-label text-ink-600 truncate">{crumb}</span>
            )}
          </Link>
          <nav aria-label="Public" className="flex items-center gap-1 sm:gap-2">
            <Link href="/demo" className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-label text-ink-700 hover:text-terracotta hover:bg-vellum-high rounded transition-all">
              Demo
            </Link>
            <Link href="/faq" className="hidden sm:inline px-3 py-1.5 text-[11px] font-semibold uppercase tracking-label text-ink-700 hover:text-terracotta hover:bg-vellum-high rounded transition-all">
              FAQ
            </Link>
            <LinkButton href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
              Sign in
            </LinkButton>
            <LinkButton href="/login" variant="primary" size="sm">
              Get started
            </LinkButton>
          </nav>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-vellum-high to-transparent" />
      </header>

      <div className="flex-1">{children}</div>

      <footer className="mt-auto border-t border-vellum-high/60">
        <div className="px-4 sm:px-8 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-5 text-[10px] font-medium uppercase tracking-label text-ink-600">
            <Link href="/faq" className="hover:text-terracotta transition-colors">FAQ</Link>
            <span className="text-ink-400" aria-hidden="true">·</span>
            <Link href="/privacy" className="hover:text-terracotta transition-colors">Privacy</Link>
            <span className="text-ink-400" aria-hidden="true">·</span>
            <Link href="/terms" className="hover:text-terracotta transition-colors">Terms</Link>
          </div>
          <p className="text-[11px] font-serif italic text-ink-600">Built for people running a serious job search.</p>
        </div>
      </footer>
    </div>
  );
}

/** Narrow article column used by FAQ, Privacy and Terms. */
export function PublicArticle({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-16 animate-fade-in-up">
      <p className="manuscript-label">{eyebrow}</p>
      <h1 className="manuscript-display text-3xl sm:text-4xl font-semibold text-ink-900 mt-1 leading-tight">{title}</h1>
      {intro && <div className="mt-3">{intro}</div>}
      {children}
    </div>
  );
}
