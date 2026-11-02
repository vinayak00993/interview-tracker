"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { FollowUpItem } from "@/lib/data/opportunities";
import { completeFollowUpAction, setFollowUpAction } from "@/lib/actions/opportunities";

export function FollowUpCard({ item }: { item: FollowUpItem }) {
  const [pending, start] = useTransition();
  const [gone, setGone] = useState(false);
  if (gone) return null;

  const snooze = () =>
    start(async () => {
      const r = await setFollowUpAction(item.id, new Date(Date.now() + 3 * 86_400_000).toISOString());
      if (r.ok) setGone(true);
    });
  const done = () =>
    start(async () => {
      const r = await completeFollowUpAction(item.id);
      if (r.ok) setGone(true);
    });

  return (
    <div className={`bg-terracotta/5 rounded px-3 py-2.5 ${pending ? "opacity-50" : ""}`}>
      <Link href={`/opportunities/${item.id}`} className="block">
        <p className="text-sm text-ink-900 font-serif font-medium leading-tight">{item.company}</p>
        <p className="text-[11px] text-ink-600 mt-0.5">{item.role}</p>
        <p className="text-[10px] uppercase tracking-label text-terracotta mt-1.5 font-medium">
          {item.reason === "scheduled" ? "Reminder due" : `Quiet for ${item.daysSinceActivity} days`}
        </p>
      </Link>
      <div className="flex gap-3 mt-2">
        <button type="button" onClick={done} disabled={pending} className="text-[10px] font-semibold uppercase tracking-label text-sage hover:underline">
          Followed up
        </button>
        <button type="button" onClick={snooze} disabled={pending} className="text-[10px] font-semibold uppercase tracking-label text-ink-600 hover:text-terracotta">
          Snooze 3 days
        </button>
      </div>
    </div>
  );
}
