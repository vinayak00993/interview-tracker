"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// App-wide bottom tab bar for phones — the same bar on every screen, with the
// active tab highlighted, so navigation feels native instead of per-page links.
const TABS = [
  {
    href: "/dashboard",
    label: "Pipeline",
    isActive: (path: string) =>
      path === "/dashboard" || path.startsWith("/opportunities"),
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="5" height="16" rx="1" />
        <rect x="10" y="4" width="5" height="10" rx="1" />
        <rect x="17" y="4" width="4" height="13" rx="1" />
      </svg>
    ),
  },
  {
    href: "/dashboard/comp",
    label: "Comp",
    isActive: (path: string) => path === "/dashboard/comp",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 20h18" />
        <path d="M6 20v-7" />
        <path d="M11 20V6" />
        <path d="M16 20v-10" />
        <path d="M21 20v-4" />
      </svg>
    ),
  },
  {
    href: "/dashboard/offers",
    label: "Offers",
    isActive: (path: string) => path === "/dashboard/offers",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="9" r="5.5" />
        <path d="M8.6 13.5 7 21l5-2.6L17 21l-1.6-7.5" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    isActive: (path: string) => path === "/profile",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c1.2-3.4 3.9-5 7-5s5.8 1.6 7 5" />
      </svg>
    ),
  },
];

export default function MobileTabBar() {
  const pathname = usePathname() || "";

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 manuscript-glass safe-bottom border-t border-vellum-high/60"
    >
      <div className="flex items-stretch">
        {TABS.map((tab) => {
          const active = tab.isActive(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 pt-2 pb-1.5 min-h-[52px] transition-colors ${
                active ? "text-terracotta" : "text-ink-600 active:text-ink-900"
              }`}
            >
              {tab.icon}
              <span className="text-[9px] uppercase tracking-label font-semibold">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
