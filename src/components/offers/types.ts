import type { OfferWithOpportunity } from "@/lib/data/offers";

export type Offer = OfferWithOpportunity;

export interface EligibleOpp {
  id: string;
  company: string;
  role: string;
  compMin: number | null;
  compMax: number | null;
}

/** Estimated annualized total: base + bonus + equity per vest year. */
export function estimatedTotal(o: Offer): number {
  const base = o.baseComp ?? 0;
  const bonus = o.annualBonus ?? (o.bonusPercent ? Math.round((base * o.bonusPercent) / 100) : 0);
  const equityPerYear = o.equityValue && o.vestYears ? Math.round(o.equityValue / o.vestYears) : 0;
  return base + bonus + equityPerYear;
}
