"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { InterviewWithFollowUps } from "@/lib/data/opportunities";
import { markFollowUpSentAction } from "@/lib/actions/interviews";
import { readNdjson } from "@/lib/ai/stream";
import { Button, ErrorText, Spinner, SuccessText } from "@/components/ui";

interface Draft {
  id: string;
  subject: string;
  body: string;
  sentAt: string | null;
}

/** Streams a follow-up email draft for a completed round and saves it. */
export function FollowUpDraftPanel({ opportunityId, interview, onClose }: { opportunityId: string; interview: InterviewWithFollowUps; onClose: () => void }) {
  const [text, setText] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/ai-followup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interviewId: interview.id }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Could not start the draft.");
        }
        await readNdjson(res, (event) => {
          if (event.type === "delta") setText((t) => t + event.text);
          else if (event.type === "done") setDraft(event.draft as Draft);
          else if (event.type === "error") setError(event.message);
        });
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Draft failed.");
      } finally {
        setStreaming(false);
      }
    })();
    return () => controller.abort();
  }, [interview.id]);

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setError("Could not copy. Select the text instead.");
    }
  };

  const markSent = () => {
    if (!draft) return;
    start(async () => {
      const r = await markFollowUpSentAction(opportunityId, draft.id);
      if (!r.ok) setError(r.error);
      else setDraft({ ...draft, sentAt: new Date().toISOString() });
    });
  };

  return (
    <div className="bg-vellum-low rounded p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="text-[10px] uppercase tracking-label text-ink-600 font-semibold flex items-center gap-2">
          {streaming && <Spinner />}
          {streaming ? "Drafting from your debrief" : "Follow-up draft"}
        </p>
        <button type="button" onClick={onClose} className="text-[10px] uppercase tracking-label text-ink-600 hover:text-terracotta">
          Close
        </button>
      </div>

      {draft ? (
        <div className="space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-label text-ink-600 font-semibold mb-1">Subject</p>
            <p className="text-sm text-ink-900 font-medium">{draft.subject}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-label text-ink-600 font-semibold mb-1">Body</p>
            <p className="text-sm text-ink-800 whitespace-pre-wrap leading-relaxed">{draft.body}</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Button size="sm" variant="secondary" onClick={() => copy("subject", draft.subject)}>
              Copy subject
            </Button>
            <Button size="sm" variant="secondary" onClick={() => copy("body", draft.body)}>
              Copy body
            </Button>
            {draft.sentAt ? (
              <SuccessText>Marked as sent.</SuccessText>
            ) : (
              <Button size="sm" onClick={markSent} loading={pending}>
                Mark as sent
              </Button>
            )}
            {copied && <SuccessText>Copied {copied}.</SuccessText>}
          </div>
        </div>
      ) : (
        <p className="text-sm text-ink-800 whitespace-pre-wrap leading-relaxed font-mono min-h-[3rem]">{text || (streaming ? "" : "No draft produced.")}</p>
      )}
      <div className="mt-2">
        <ErrorText>{error}</ErrorText>
      </div>
    </div>
  );
}
