"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { PrepSheet } from "@/lib/ai/prep";
import { deletePrepAction } from "@/lib/actions/interviews";
import { formatDate } from "@/lib/format";
import { Button, Card, EmptyState, ErrorText, LinkButton, Select, Spinner, cx } from "@/components/ui";
import { PrepSheetView } from "./PrepSheetView";

export interface PrepRound {
  id: string;
  round: string;
  roundNumber: number;
  status: string;
  dateTime: string | null;
}

export interface PrepRecord {
  id: string;
  interviewId: string | null;
  createdAt: string;
  model: string;
  content: string;
}

interface Props {
  opportunityId: string;
  interviews: PrepRound[];
  preps: PrepRecord[];
  hasProfile: boolean;
  debriefCount: number;
  initialInterviewId: string | null;
}

function parseSheet(content: string): PrepSheet | null {
  try {
    const parsed = JSON.parse(content) as PrepSheet;
    return parsed && Array.isArray(parsed.talkingPoints) ? parsed : null;
  } catch {
    return null;
  }
}

export function PrepPanel({ opportunityId, interviews, preps: initialPreps, hasProfile, debriefCount, initialInterviewId }: Props) {
  const nextScheduled = interviews.find((i) => i.status === "scheduled");
  const [interviewId, setInterviewId] = useState<string>(initialInterviewId ?? nextScheduled?.id ?? "");
  const [preps, setPreps] = useState(initialPreps);
  const [selected, setSelected] = useState<string | null>(initialPreps[0]?.id ?? null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => setPreps(initialPreps), [initialPreps]);

  const roundLabel = (id: string | null) => {
    const round = interviews.find((i) => i.id === id);
    return round ? `${round.round} (round ${round.roundNumber})` : "General";
  };

  const current = useMemo(() => preps.find((p) => p.id === selected) ?? preps[0] ?? null, [preps, selected]);
  const sheet = current ? parseSheet(current.content) : null;

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId, interviewId: interviewId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Prep generation failed.");
      const record = data.prep as PrepRecord;
      setPreps((prev) => [record, ...prev]);
      setSelected(record.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prep generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const remove = (id: string) => {
    if (!confirm("Delete this prep sheet?")) return;
    start(async () => {
      const r = await deletePrepAction(opportunityId, id);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setPreps((prev) => prev.filter((p) => p.id !== id));
      if (selected === id) setSelected(null);
    });
  };

  if (!hasProfile) {
    return (
      <Card tone="low">
        <EmptyState
          title="Prep needs your background first."
          hint="Upload your resume or paste your LinkedIn about section. Every prep sheet is built from it, so this is the one step that cannot be skipped."
          action={<LinkButton href="/profile" variant="primary">Set up profile</LinkButton>}
        />
      </Card>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      <Card tone="glass">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
          <div className="flex-1">
            <p className="manuscript-label">AI prep</p>
            <h3 className="manuscript-display text-xl font-semibold text-ink-900 mt-1">Prepare for a specific round</h3>
            <p className="text-sm font-serif italic text-ink-700 mt-1.5 max-w-lg">
              Built from your resume, the job description, and {debriefCount > 0 ? `${debriefCount} earlier debrief${debriefCount > 1 ? "s" : ""}` : "your notes"}. Gaps flagged in earlier sheets carry forward until a debrief closes them.
            </p>
          </div>
          <div className="flex items-end gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:w-56">
              <label className="manuscript-label block mb-1.5">Round</label>
              <Select value={interviewId} onChange={(e) => setInterviewId(e.target.value)} disabled={generating}>
                <option value="">General, no specific round</option>
                {interviews.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.round} (round {i.roundNumber}){i.status === "completed" ? ", done" : ""}
                  </option>
                ))}
              </Select>
            </div>
            <Button onClick={generate} loading={generating}>
              {generating ? "Working" : preps.length ? "Generate again" : "Generate prep"}
            </Button>
          </div>
        </div>
        {generating && (
          <p className="text-xs text-ink-700 mt-4 flex items-center gap-2">
            <Spinner /> Reading your resume, the JD, and {debriefCount} earlier debrief{debriefCount === 1 ? "" : "s"}. This takes about half a minute.
          </p>
        )}
        <div className="mt-3">
          <ErrorText>{error}</ErrorText>
        </div>
      </Card>

      {preps.length === 0 ? (
        <Card tone="low">
          <EmptyState title="No prep sheet yet." hint={nextScheduled ? `Generate one for ${nextScheduled.round} to get talking points, likely questions, and stories.` : "Add an interview round, or generate a general sheet for the first conversation."} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1 lg:order-2">
            <p className="manuscript-label mb-2">History</p>
            <ul className="space-y-1.5">
              {preps.map((p) => {
                const active = current?.id === p.id;
                return (
                  <li key={p.id} className={cx("rounded px-3 py-2.5 transition-colors", active ? "bg-terracotta/10" : "bg-vellum-low hover:bg-vellum-mid")}>
                    <button type="button" onClick={() => setSelected(p.id)} className="w-full text-left">
                      <p className={cx("text-sm font-medium leading-tight", active ? "text-terracotta" : "text-ink-900")}>{roundLabel(p.interviewId)}</p>
                      <p className="text-[10px] uppercase tracking-label text-ink-600 mt-1">{formatDate(p.createdAt, "long")}</p>
                    </button>
                    <button type="button" onClick={() => remove(p.id)} disabled={pending} className="mt-1 text-[10px] uppercase tracking-label text-ink-600 hover:text-terracotta">
                      Delete
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>
          <div className="lg:col-span-3 lg:order-1">
            {current && sheet ? (
              <PrepSheetView sheet={sheet} roundLabel={roundLabel(current.interviewId)} generatedAt={current.createdAt} model={current.model} />
            ) : (
              <Card tone="low">
                <EmptyState title="This sheet could not be read." hint="It was saved in an older format. Generate a fresh one." />
              </Card>
            )}
            <p className="text-[11px] text-ink-600 mt-4 font-serif italic">
              Debrief after the round on the <Link href={`/opportunities/${opportunityId}/interviews`} className="text-terracotta underline underline-offset-2">Interviews tab</Link> and the next sheet will build on it.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
