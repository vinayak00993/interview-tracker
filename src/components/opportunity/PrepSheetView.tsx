"use client";

import { useState } from "react";
import type { PrepSheet } from "@/lib/ai/prep";
import { formatDate } from "@/lib/format";
import { Badge, Card, cx } from "@/components/ui";

function Section({ title, children, count }: { title: string; children: React.ReactNode; count?: number }) {
  return (
    <section>
      <h3 className="manuscript-label mb-2 flex items-center gap-2">
        {title}
        {count != null && <span className="text-ink-400 normal-case tracking-normal">{count}</span>}
      </h3>
      {children}
    </section>
  );
}

export function PrepSheetView({ sheet, roundLabel, generatedAt, model }: { sheet: PrepSheet; roundLabel: string; generatedAt: string; model: string }) {
  const [openStory, setOpenStory] = useState<number | null>(0);

  return (
    <div className="space-y-6">
      <Card tone="accent">
        <p className="text-[10px] uppercase tracking-label text-terracotta font-semibold">{roundLabel}</p>
        <p className="font-serif text-xl text-ink-900 leading-snug mt-1.5">{sheet.headline}</p>
        <p className="text-[10px] uppercase tracking-label text-ink-600 mt-3">
          Generated {formatDate(generatedAt, "long")} · {model}
        </p>
      </Card>

      <Section title="Talking points" count={sheet.talkingPoints.length}>
        <Card>
          <ol className="space-y-3">
            {sheet.talkingPoints.map((tp, i) => (
              <li key={i} className="flex gap-3">
                <span className="font-serif text-terracotta text-lg leading-none mt-0.5 w-5 shrink-0">{i + 1}</span>
                <div>
                  <p className="text-sm text-ink-900 font-medium leading-snug">{tp.point}</p>
                  <p className="text-xs text-ink-700 mt-1 leading-relaxed">{tp.evidence}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </Section>

      <Section title="Gaps and how to handle them" count={sheet.gaps.length}>
        <div className="space-y-2">
          {sheet.gaps.map((g, i) => (
            <Card key={i} tone="low">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-ink-900 font-medium leading-snug">{g.gap}</p>
                {g.carriedFromEarlierRound && <Badge className="bg-terracotta/10 text-terracotta shrink-0">Still open</Badge>}
              </div>
              <p className="text-xs text-ink-700 mt-1.5 leading-relaxed">{g.howToAddress}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Likely questions" count={sheet.likelyQuestions.length}>
        <Card>
          <ul className="divide-y divide-vellum-high">
            {sheet.likelyQuestions.map((q, i) => (
              <li key={i} className="py-3 first:pt-0 last:pb-0">
                <p className="text-sm font-serif text-ink-900 leading-snug">“{q.question}”</p>
                <p className="text-xs text-ink-700 mt-1 leading-relaxed">{q.angle}</p>
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      <Section title="Stories to have ready" count={sheet.stories.length}>
        <div className="space-y-2">
          {sheet.stories.map((s, i) => {
            const open = openStory === i;
            return (
              <Card key={i} className="p-0 sm:p-0">
                <button type="button" onClick={() => setOpenStory(open ? null : i)} className="w-full text-left px-4 sm:px-5 py-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-ink-900 font-medium leading-snug">{s.title}</p>
                    <p className="text-[11px] text-ink-600 mt-0.5">Use for: {s.useFor}</p>
                  </div>
                  <span className="text-ink-600 text-lg leading-none" aria-hidden="true">
                    {open ? "−" : "+"}
                  </span>
                </button>
                <div className={cx("px-4 sm:px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3", !open && "hidden")}>
                  {(["situation", "task", "action", "result"] as const).map((k) => (
                    <div key={k}>
                      <p className="text-[10px] uppercase tracking-label text-ink-600 font-semibold">{k}</p>
                      <p className="text-xs text-ink-800 mt-0.5 leading-relaxed">{s[k]}</p>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Questions to ask them" count={sheet.questionsToAsk.length}>
          <Card>
            <ul className="space-y-2">
              {sheet.questionsToAsk.map((q, i) => (
                <li key={i} className="text-sm text-ink-800 leading-snug flex gap-2">
                  <span className="text-terracotta shrink-0">·</span>
                  {q}
                </li>
              ))}
            </ul>
          </Card>
        </Section>
        <Section title="Research before you go" count={sheet.research.length}>
          <Card>
            <ul className="space-y-2">
              {sheet.research.map((r, i) => (
                <li key={i} className="text-sm text-ink-800 leading-snug flex gap-2">
                  <span className="text-sage shrink-0">·</span>
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      </div>
    </div>
  );
}
