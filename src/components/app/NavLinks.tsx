"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui";

export const NAV = [
  { href: "/dashboard", label: "Pipeline", match: (p: string) => p === "/dashboard" || p.startsWith("/opportunities") },
  { href: "/dashboard/comp", label: "Comp", match: (p: string) => p === "/dashboard/comp" },
  { href: "/dashboard/offers", label: "Offers", match: (p: string) => p === "/dashboard/offers" },
  { href: "/contacts", label: "Contacts", match: (p: string) => p.startsWith("/contacts") },
  { href: "/documents", label: "Documents", match: (p: string) => p.startsWith("/documents") },
];

export function NavLinks() {
  const pathname = usePathname() || "";
  return (
    <nav aria-label="Primary" className="hidden md:flex items-center gap-1 flex-1 justify-center">
      {NAV.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "px-3 py-1.5 text-[11px] font-semibold uppercase tracking-label rounded transition-all",
              active ? "text-terracotta bg-terracotta/10" : "text-ink-700 hover:text-terracotta hover:bg-vellum-high"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
