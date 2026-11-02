import Link from "next/link";
import { Logo } from "@/components/Logo";
import { NavLinks } from "./NavLinks";
import { LogoutButton } from "./LogoutButton";

export function AppHeader({ name }: { name: string }) {
  return (
    <header className="manuscript-glass shrink-0 md:sticky md:top-0 z-20">
      <div className="px-4 sm:px-8 lg:px-12 h-14 sm:h-16 flex items-center justify-between gap-4">
        <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
          <Logo size={26} className="shrink-0" />
          <span className="manuscript-display text-lg sm:text-xl font-semibold text-ink-900 leading-none truncate">Interview Tracker</span>
        </Link>
        <NavLinks />
        <div className="flex items-center gap-2 pl-3 sm:border-l sm:border-vellum-high">
          <Link href="/profile" className="hidden sm:inline text-xs text-ink-700 font-medium truncate max-w-[140px] hover:text-terracotta transition-colors">
            {name}
          </Link>
          <LogoutButton />
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-vellum-high to-transparent" />
    </header>
  );
}
