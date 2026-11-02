"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui";

const TABS = [
  { key: "", label: "Overview" },
  { key: "interviews", label: "Interviews" },
  { key: "prep", label: "Prep" },
  { key: "notes", label: "Notes" },
  { key: "contacts", label: "Contacts" },
  { key: "activity", label: "Activity" },
] as const;

export function OpportunityTabs({ id, counts }: { id: string; counts: Partial<Record<(typeof TABS)[number]["key"], number>> }) {
  const pathname = usePathname() || "";
  const base = `/opportunities/${id}`;
  return (
    <div className="-mx-2 px-2">
      <nav aria-label="Opportunity sections" className="flex gap-1 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => {
          const href = tab.key ? `${base}/${tab.key}` : base;
          const active = tab.key ? pathname.startsWith(href) : pathname === base;
          const count = counts[tab.key];
          return (
            <Link
              key={tab.key}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cx("px-4 py-2.5 text-[11px] font-semibold uppercase tracking-label transition-all whitespace-nowrap relative", active ? "text-terracotta" : "text-ink-600 hover:text-ink-900")}
            >
              {tab.label}
              {count != null && count > 0 && <span className="ml-1.5 text-ink-600 normal-case tracking-normal">{count}</span>}
              {active && <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-terracotta rounded-t" />}
            </Link>
          );
        })}
      </nav>
      <div className="h-px bg-vellum-high" />
    </div>
  );
}
