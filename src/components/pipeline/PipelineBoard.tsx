"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { STAGES, PRIORITY_BORDER } from "@/lib/pipeline";
import { changeStatusAction } from "@/lib/actions/opportunities";
import { Button, cx } from "@/components/ui";
import { Dialog } from "@/components/ui/Dialog";
import { PipelineCardContent, type PipelineCardData } from "./PipelineCard";
import { AddOpportunityDialog } from "./AddOpportunityDialog";

interface Props {
  opportunities: PipelineCardData[];
  /** Demo mode renders the same board without actions. */
  readOnly?: boolean;
}

export function PipelineBoard({ opportunities, readOnly = false }: Props) {
  const [items, setItems] = useState(opportunities);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [moveTarget, setMoveTarget] = useState<PipelineCardData | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("");
  const [tier, setTier] = useState("");
  const [showComp, setShowComp] = useState(true);

  const [mobileCol, setMobileCol] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const programmatic = useRef(false);

  useEffect(() => setItems(opportunities), [opportunities]);

  const filtered = items.filter((o) => {
    if (query) {
      const q = query.toLowerCase();
      if (!o.company.toLowerCase().includes(q) && !o.role.toLowerCase().includes(q) && !(o.location ?? "").toLowerCase().includes(q)) return false;
    }
    if (priority && o.priority !== priority) return false;
    if (tier && o.tier !== Number(tier)) return false;
    return true;
  });
  const hasFilters = Boolean(query || priority || tier);
  const grouped = STAGES.map((stage) => ({ ...stage, items: filtered.filter((o) => o.status === stage.status) }));

  const move = useCallback(
    (id: string, status: string) => {
      if (readOnly) return;
      const current = items.find((o) => o.id === id);
      if (!current || current.status === status) return;
      const previous = current.status;
      setError(null);
      setItems((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      startTransition(async () => {
        const result = await changeStatusAction(id, status);
        if (!result.ok) {
          setItems((prev) => prev.map((o) => (o.id === id ? { ...o, status: previous } : o)));
          setError(result.error);
        }
      });
    },
    [items, readOnly]
  );

  const scrollToCol = useCallback((index: number) => {
    setMobileCol(index);
    const el = carouselRef.current;
    if (!el) return;
    programmatic.current = true;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
    window.setTimeout(() => (programmatic.current = false), 450);
  }, []);

  const onCarouselScroll = useCallback(() => {
    if (programmatic.current) return;
    const el = carouselRef.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setMobileCol((prev) => {
      if (index === prev) return prev;
      chipRefs.current[index]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      return index;
    });
  }, []);

  const cardHref = (id: string) => (readOnly ? "/login" : `/opportunities/${id}`);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-end justify-between mb-5 gap-3 flex-wrap">
        <div>
          <p className="manuscript-label">Pipeline</p>
          <h2 className="manuscript-display text-2xl sm:text-[1.75rem] font-semibold text-ink-900 leading-tight mt-0.5">Opportunities</h2>
        </div>
        {!readOnly && <Button onClick={() => setShowAdd(true)}>+ Add Opportunity</Button>}
      </div>

      {/* Search and filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6 bg-vellum-low rounded px-3 py-2">
        <div className="relative flex-1 min-w-full sm:min-w-[180px] sm:max-w-sm">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company, role, or location"
            className="w-full pl-8 pr-3 py-2 sm:py-1.5 bg-transparent text-ink-900 text-xs focus:outline-none focus:bg-vellum-lowest rounded border-b border-transparent focus:border-terracotta transition-all placeholder:text-ink-600"
          />
          <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="px-2.5 py-1.5 bg-transparent text-ink-700 text-[11px] font-medium uppercase tracking-label focus:outline-none cursor-pointer">
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={tier} onChange={(e) => setTier(e.target.value)} className="px-2.5 py-1.5 bg-transparent text-ink-700 text-[11px] font-medium uppercase tracking-label focus:outline-none cursor-pointer">
          <option value="">All tiers</option>
          <option value="1">Tier I</option>
          <option value="2">Tier II</option>
          <option value="3">Tier III</option>
        </select>
        <button
          type="button"
          onClick={() => setShowComp((v) => !v)}
          className={cx("px-2.5 py-1 text-[11px] font-semibold uppercase tracking-label rounded transition-all", showComp ? "text-terracotta bg-terracotta/10" : "text-ink-600 hover:text-terracotta")}
        >
          {showComp ? "Hide salary" : "Show salary"}
        </button>
        {hasFilters && (
          <>
            <button type="button" onClick={() => { setQuery(""); setPriority(""); setTier(""); }} className="px-2 py-1 text-[11px] uppercase tracking-label text-ink-600 hover:text-terracotta transition-colors">
              Clear
            </button>
            <span className="text-[10px] uppercase tracking-label text-ink-600 ml-auto">
              {filtered.length} of {items.length}
            </span>
          </>
        )}
      </div>

      {error && <p className="mb-4 text-terracotta text-xs font-serif italic">{error}</p>}

      {/* Mobile: one stage at a time, swipe or tap a chip. */}
      <div className="md:hidden">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-3">
          {grouped.map((col, i) => (
            <button
              key={col.status}
              ref={(el) => { chipRefs.current[i] = el; }}
              type="button"
              onClick={() => scrollToCol(i)}
              className={cx(
                "shrink-0 flex items-center gap-1.5 pl-3.5 pr-2.5 py-2 rounded-full text-[11px] font-semibold uppercase tracking-label transition-colors",
                i === mobileCol ? "bg-terracotta text-vellum" : "bg-vellum-low text-ink-700 active:bg-vellum-mid"
              )}
            >
              {col.label}
              <span className={cx("min-w-[20px] h-[18px] px-1 rounded-full text-[10px] flex items-center justify-center", i === mobileCol ? "bg-vellum/25" : "bg-vellum-high text-ink-600")}>
                {col.items.length}
              </span>
            </button>
          ))}
        </div>

        <div ref={carouselRef} onScroll={onCarouselScroll} className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide overscroll-x-contain -mx-4">
          {grouped.map((col) => (
            <div key={col.status} className="w-full shrink-0 snap-center px-4">
              <div className={cx("rounded-lg p-3 min-h-[45vh]", col.surface)}>
                <div className="space-y-2.5">
                  {col.items.map((opp) => (
                    <div key={opp.id} className={cx("relative bg-vellum-lowest rounded border-l-[3px] shadow-card", PRIORITY_BORDER[opp.priority] || "border-l-transparent")}>
                      <Link href={cardHref(opp.id)} className="block p-3.5 pr-12 rounded active:bg-vellum-low transition-colors">
                        <PipelineCardContent opp={opp} showComp={showComp} hidePriorityDot />
                      </Link>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => setMoveTarget(opp)}
                          aria-label={`Move ${opp.company} to another stage`}
                          className="absolute top-1.5 right-1.5 w-10 h-10 flex items-center justify-center rounded-full text-ink-600 active:bg-vellum-mid transition-colors"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  {col.items.length === 0 && <div className="text-sm font-serif italic text-ink-600 px-2 py-10 text-center">Nothing here yet.</div>}
                </div>
                {col.status === "saved" && !readOnly && (
                  <button type="button" onClick={() => setShowAdd(true)} className="w-full mt-2.5 py-3 text-[11px] font-semibold uppercase tracking-label text-terracotta active:bg-terracotta/10 rounded transition-colors">
                    + Add Opportunity
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-3">
          {grouped.map((col, i) => (
            <span key={col.status} className={cx("rounded-full transition-all", i === mobileCol ? "w-4 h-1.5 bg-terracotta" : "w-1.5 h-1.5 bg-vellum-highest")} />
          ))}
        </div>
      </div>

      {/* Desktop columns */}
      <div className="hidden md:flex gap-3 sm:gap-4 min-h-[50vh] sm:min-h-[calc(100vh-280px)] overflow-x-auto pb-4 -mx-2 px-2">
        {grouped.map((col) => {
          const isTarget = dragOver === col.status;
          return (
            <div
              key={col.status}
              className={cx("flex-1 min-w-[200px] sm:min-w-[240px] flex flex-col rounded-lg transition-all duration-300", isTarget ? "ring-2 ring-terracotta/30 scale-[1.01] bg-vellum-mid" : col.surface)}
              onDragOver={(e) => { if (readOnly) return; e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (dragOver !== col.status) setDragOver(col.status); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => { e.preventDefault(); setDragOver(null); setDraggedId(null); const id = e.dataTransfer.getData("text/plain"); if (id) move(id, col.status); }}
            >
              <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 min-w-0">
                  <span className={cx("w-1.5 h-1.5 rounded-full shrink-0", col.marker)} aria-hidden="true" />
                  <span className={cx("text-[11px] font-semibold uppercase tracking-label truncate", col.accent)}>{col.label}</span>
                </span>
                <span className={cx("min-w-[22px] h-5 px-1.5 rounded text-[10px] font-semibold flex items-center justify-center", col.chip)}>{col.items.length}</span>
              </div>

              <div className="flex-1 px-3 pb-3 space-y-2.5 overflow-y-auto">
                {col.items.map((opp) => (
                  <div
                    key={opp.id}
                    draggable={!readOnly}
                    onDragStart={(e) => { setDraggedId(opp.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", opp.id); }}
                    onDragEnd={() => setDraggedId(null)}
                    className={cx(
                      "group bg-vellum-lowest rounded border-l-[3px] p-3 shadow-card hover-lift transition-all",
                      PRIORITY_BORDER[opp.priority] || "border-l-transparent",
                      !readOnly && "cursor-grab active:cursor-grabbing",
                      draggedId === opp.id && "opacity-40 scale-95 rotate-1"
                    )}
                  >
                    <Link href={cardHref(opp.id)} className="block">
                      <PipelineCardContent opp={opp} showComp={showComp} />
                    </Link>
                  </div>
                ))}
                {col.items.length === 0 && <div className="text-[11px] font-serif italic text-ink-600 px-2 py-4 text-center">Empty</div>}
              </div>

              {col.status === "saved" && !readOnly && (
                <button type="button" onClick={() => setShowAdd(true)} className="mx-3 mb-3 mt-1 py-2.5 text-[11px] font-semibold uppercase tracking-label text-terracotta hover:bg-terracotta/5 rounded transition-colors">
                  + Add Opportunity
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile move sheet */}
      <Dialog open={Boolean(moveTarget)} onClose={() => setMoveTarget(null)} eyebrow="Move to stage" title={moveTarget ? `${moveTarget.company} · ${moveTarget.role}` : ""}>
        <div className="space-y-0.5">
          {STAGES.map((stage, i) => {
            const isCurrent = stage.status === moveTarget?.status;
            return (
              <button
                key={stage.status}
                type="button"
                disabled={isCurrent}
                onClick={() => { if (moveTarget) move(moveTarget.id, stage.status); setMoveTarget(null); scrollToCol(i); }}
                className={cx("w-full flex items-center gap-3 px-3 py-3.5 rounded-lg text-left transition-colors", isCurrent ? "bg-vellum-low" : "active:bg-vellum-mid hover:bg-vellum-low")}
              >
                <span className={cx("w-2 h-2 rounded-full shrink-0", stage.marker)} aria-hidden="true" />
                <span className="text-[15px] font-medium text-ink-900">{stage.label}</span>
                {isCurrent && <span className="ml-auto text-[10px] uppercase tracking-label text-ink-600 font-semibold">Current</span>}
              </button>
            );
          })}
        </div>
      </Dialog>

      {!readOnly && <AddOpportunityDialog open={showAdd} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
