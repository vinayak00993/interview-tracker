import { CompanyAvatar } from "@/components/CompanyAvatar";
import { PRIORITY_DOT, formatLocation } from "@/lib/pipeline";

export interface PipelineCardData {
  id: string;
  company: string;
  role: string;
  location: string | null;
  remote: boolean;
  fitScore: number | null;
  compMin: number | null;
  compMax: number | null;
  priority: string;
  tier: number | null;
  status: string;
  source: string | null;
  website: string | null;
  followUpAt?: string | null;
  _count: { interviews: number };
}

/** Card body shared by the desktop drag cards, the mobile list, and the demo. */
export function PipelineCardContent({ opp, showComp, hidePriorityDot = false }: { opp: PipelineCardData; showComp: boolean; hidePriorityDot?: boolean }) {
  const chips: { key: string; label: string; cls: string }[] = [];
  if (opp.fitScore != null) chips.push({ key: "fit", label: `${opp.fitScore}% fit`, cls: "text-terracotta" });
  if (opp.tier != null) chips.push({ key: "tier", label: `T${opp.tier}`, cls: "text-ink-600" });
  if (opp.source === "referral") chips.push({ key: "ref", label: "Referral", cls: "text-sage" });
  if (opp._count.interviews > 0) chips.push({ key: "int", label: `${opp._count.interviews} int.`, cls: "text-ink-600" });

  return (
    <>
      <div className="flex items-start gap-2.5">
        <CompanyAvatar company={opp.company} website={opp.website} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1.5">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-label text-ink-600 font-semibold truncate">{opp.company}</p>
              <h3 className="text-[15px] font-serif font-medium text-ink-900 leading-tight mt-0.5 line-clamp-2">{opp.role}</h3>
            </div>
            {!hidePriorityDot && opp.priority && (
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${PRIORITY_DOT[opp.priority] || "bg-ink-400"}`} title={`${opp.priority} priority`} />
            )}
          </div>
        </div>
      </div>

      {showComp && opp.compMin != null && opp.compMax != null && (
        <p className="text-[11px] text-ink-700 mt-2 font-medium">
          ${opp.compMin}K to ${opp.compMax}K
        </p>
      )}

      {(opp.location || opp.remote) && <p className="text-[11px] text-ink-600 mt-0.5 truncate">{formatLocation(opp.location, opp.remote)}</p>}

      {chips.length > 0 && (
        <div className="flex items-center gap-x-2 gap-y-1 mt-2 flex-wrap">
          {chips.map((chip, i) => (
            <span key={chip.key} className="flex items-center gap-x-2">
              {i > 0 && <span className="text-ink-400 text-[10px]">·</span>}
              <span className={`text-[10px] font-semibold uppercase tracking-label ${chip.cls}`}>{chip.label}</span>
            </span>
          ))}
        </div>
      )}
    </>
  );
}
