"use client";

import { useMemo, useState, useTransition } from "react";
import { Button, Card, EmptyState, ErrorText, PageTitle, SectionTitle } from "@/components/ui";
import { CompanyAvatar } from "@/components/CompanyAvatar";
import { deleteOfferAction } from "@/lib/actions/offers";
import { AddOfferDialog } from "./AddOfferDialog";
import { OfferAdvisor } from "./OfferAdvisor";
import { estimatedTotal, type EligibleOpp, type Offer } from "./types";

export function OfferComparison(props: { offers: Offer[]; eligible: EligibleOpp[] }) {
  return (
    <OfferAdvisor.Provider>
      <OfferComparisonInner {...props} />
    </OfferAdvisor.Provider>
  );
}

function OfferComparisonInner({ offers, eligible }: { offers: Offer[]; eligible: EligibleOpp[] }) {
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const maxTotal = useMemo(() => Math.max(1, ...offers.map(estimatedTotal)), [offers]);

  const remove = (opportunityId: string) => {
    if (!confirm("Remove this offer from the comparison?")) return;
    setError(null);
    start(async () => {
      const r = await deleteOfferAction(opportunityId);
      if (!r.ok) setError(r.error);
    });
  };

  return (
    <div>
      <PageTitle
        eyebrow="Offers"
        title="Offer comparison"
        description="Paste offer letters or emails and compare them side by side. With two or more, the advisor weighs them against your background."
        actions={
          <>
            {offers.length >= 2 && <OfferAdvisor.Trigger />}
            <Button variant="secondary" onClick={() => setShowAdd(true)}>
              + Add offer
            </Button>
          </>
        }
      />

      {error && <div className="mb-4"><ErrorText>{error}</ErrorText></div>}

      {offers.length === 0 && (
        <Card>
          <EmptyState
            title="No offers yet."
            hint="Add an offer letter or paste an offer email to start comparing. Opportunities in the Interviewing or Offer stage are eligible."
            action={<Button onClick={() => setShowAdd(true)}>+ Add offer</Button>}
          />
        </Card>
      )}

      {offers.length > 0 && (
        <Card className="mb-6">
          <SectionTitle>Estimated annualized total</SectionTitle>
          <div className="space-y-3">
            {offers.map((o) => {
              const total = estimatedTotal(o);
              return (
                <div key={o.id}>
                  <div className="flex items-baseline justify-between mb-1 gap-3">
                    <span className="flex items-center gap-2 text-sm font-serif font-medium text-ink-900 min-w-0">
                      <CompanyAvatar company={o.company} website={o.website} size={20} />
                      <span className="truncate">{o.company}</span>
                    </span>
                    <span className="text-sm font-semibold text-terracotta whitespace-nowrap">
                      ${total}K <span className="text-[10px] uppercase tracking-label text-ink-600 font-medium">/yr</span>
                    </span>
                  </div>
                  <div className="h-2 bg-vellum-mid rounded-full overflow-hidden">
                    <div className="h-full bg-terracotta rounded-full transition-all duration-500" style={{ width: `${(total / maxTotal) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-ink-600 mt-3">Base plus annual bonus plus equity divided by vest years. Sign-on bonuses are excluded.</p>
        </Card>
      )}

      {offers.length > 0 && (
        <div className={`overflow-x-auto bg-vellum-lowest rounded-lg shadow-card mb-6 ${pending ? "opacity-60" : ""}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-vellum-high">
                <th className="text-left p-4 text-[10px] uppercase tracking-label text-ink-600 font-semibold w-36">Field</th>
                {offers.map((o) => (
                  <th key={o.id} className="text-left p-4 min-w-[200px] align-top">
                    <div className="text-[10px] uppercase tracking-label text-ink-600 font-semibold">{o.company}</div>
                    <div className="text-sm font-serif font-medium text-ink-900 mt-0.5">{o.title || o.role}</div>
                    <button type="button" onClick={() => remove(o.opportunityId)} className="text-[10px] text-ink-400 hover:text-terracotta mt-1 uppercase tracking-label">
                      Remove
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-ink-800">
              <Row label="Base" offers={offers} render={(o) => (o.baseComp ? `$${o.baseComp}K` : "-")} />
              <Row label="Annual bonus" offers={offers} render={(o) => (o.annualBonus ? `$${o.annualBonus}K` : o.bonusPercent ? `${o.bonusPercent}% of base` : "-")} />
              <Row label="Sign-on" offers={offers} render={(o) => (o.signOnBonus ? `$${o.signOnBonus}K` : "-")} />
              <Row label="Equity" offers={offers} render={(o) => (o.equityValue ? `${o.equityType || "equity"} $${o.equityValue}K` : o.equityType && o.equityType !== "none" ? o.equityType : "-")} />
              <Row label="Vest" offers={offers} render={(o) => (o.vestYears ? `${o.vestYears} yr${o.vestCliff ? `, ${o.vestCliff} mo cliff` : ""}` : o.vestSchedule || "-")} />
              <Row label="Level" offers={offers} render={(o) => o.level || "-"} />
              <Row label="Location" offers={offers} render={(o) => o.location || "-"} />
              <Row label="Remote" offers={offers} render={(o) => o.remotePolicy || "-"} />
              <Row label="PTO" offers={offers} render={(o) => (o.ptoDays === -1 ? "Unlimited" : o.ptoDays ? `${o.ptoDays} days` : "-")} />
              <Row label="Healthcare" offers={offers} render={(o) => o.healthcare || "-"} multiline />
              <Row label="Start" offers={offers} render={(o) => o.startDate || "-"} />
              <Row label="Expires" offers={offers} render={(o) => o.expiryDate || "-"} />
              <Row label="Benefits" offers={offers} render={(o) => o.benefits || "-"} multiline />
              <Row label="Summary" offers={offers} render={(o) => o.aiSummary || "-"} multiline />
            </tbody>
          </table>
        </div>
      )}

      {offers.length >= 2 && <OfferAdvisor.Panel />}

      <AddOfferDialog open={showAdd} onClose={() => setShowAdd(false)} eligible={eligible} />
    </div>
  );
}

function Row({ label, offers, render, multiline }: { label: string; offers: Offer[]; render: (o: Offer) => string; multiline?: boolean }) {
  return (
    <tr className="border-b border-vellum-mid/40">
      <td className="p-4 text-[10px] uppercase tracking-label text-ink-600 font-semibold align-top">{label}</td>
      {offers.map((o) => (
        <td key={o.id} className={`p-4 align-top ${multiline ? "text-xs" : "text-sm"}`}>
          {render(o)}
        </td>
      ))}
    </tr>
  );
}
