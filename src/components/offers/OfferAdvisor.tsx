"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Button, Card, ErrorText, Spinner } from "@/components/ui";
import { Markdown } from "@/components/ui/Markdown";
import { readNdjson } from "@/lib/ai/stream";

interface AdvisorState {
  text: string;
  loading: boolean;
  error: string | null;
  run: () => void;
}

const Ctx = createContext<AdvisorState | null>(null);

/**
 * The trigger lives in the page title and the output lives below the
 * table, so the state is shared through a small provider.
 */
function Provider({ children }: { children: ReactNode }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    setText("");
    try {
      const res = await fetch("/api/offers/advise", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Advisor failed (${res.status})`);
      }
      await readNdjson(res, (event) => {
        if (event.type === "delta") setText((t) => t + event.text);
        else if (event.type === "error") setError(event.message);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Advisor failed");
    }
    setLoading(false);
  };

  return <Ctx.Provider value={{ text, loading, error, run }}>{children}</Ctx.Provider>;
}

function Trigger() {
  const s = useContext(Ctx);
  if (!s) return null;
  return (
    <Button onClick={s.run} loading={s.loading}>
      {s.text ? "Ask again" : "Ask the advisor"}
    </Button>
  );
}

function Panel() {
  const s = useContext(Ctx);
  if (!s || (!s.text && !s.loading && !s.error)) return null;
  return (
    <Card tone="glass" className="animate-fade-in-up">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-vellum-high">
        <div className="w-8 h-8 rounded bg-terracotta/10 flex items-center justify-center text-terracotta text-sm">✦</div>
        <div>
          <p className="manuscript-label">Offer advisor</p>
          <p className="text-[11px] text-ink-600 font-serif italic">Deep model tier. Uses your resume and every offer above.</p>
        </div>
        {s.loading && <Spinner className="ml-auto text-terracotta" />}
      </div>
      {s.error && <ErrorText>{s.error}</ErrorText>}
      {s.text ? <Markdown>{s.text}</Markdown> : s.loading ? <p className="text-sm font-serif italic text-ink-600">Reading the offers.</p> : null}
    </Card>
  );
}

export const OfferAdvisor = { Provider, Trigger, Panel };
