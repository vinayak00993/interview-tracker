/** Sample data for the landing page and the public demo. Fictional people and roles. */
import type { PipelineCardData } from "@/components/pipeline/PipelineCard";

const days = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();

const opp = (
  id: string,
  company: string,
  website: string,
  role: string,
  location: string,
  status: string,
  rest: Partial<PipelineCardData> & { interviews?: number } = {}
): PipelineCardData => {
  const { interviews = 0, ...fields } = rest;
  return {
    id,
    company,
    website,
    role,
    location,
    remote: /remote/i.test(location),
    fitScore: null,
    compMin: null,
    compMax: null,
    priority: "medium",
    tier: null,
    status,
    source: null,
    followUpAt: null,
    _count: { interviews },
    ...fields,
  };
};

export const DEMO_OPPORTUNITIES: PipelineCardData[] = [
  opp("d1", "Stripe", "https://stripe.com", "Head of Strategic Partnerships", "San Francisco, CA", "interviewing", { fitScore: 92, compMin: 280, compMax: 400, priority: "high", tier: 1, interviews: 2, source: "referral" }),
  opp("d2", "Figma", "https://figma.com", "Director of Business Development", "San Francisco, CA", "interviewing", { fitScore: 88, compMin: 250, compMax: 350, priority: "high", tier: 1, interviews: 1, source: "recruiter" }),
  opp("d3", "Notion", "https://notion.so", "Strategic Partnerships Lead", "New York, NY", "applied", { fitScore: 85, compMin: 220, compMax: 320, priority: "medium", tier: 1, source: "direct" }),
  opp("d4", "Databricks", "https://databricks.com", "Senior Director, Alliances", "San Francisco, CA", "saved", { fitScore: 80, compMin: 300, compMax: 420, priority: "high", tier: 1, source: "direct" }),
  opp("d5", "Vercel", "https://vercel.com", "Head of Partnerships", "Remote", "saved", { fitScore: 78, compMin: 200, compMax: 300, priority: "medium", tier: 2, source: "job_board" }),
  opp("d6", "Linear", "https://linear.app", "Business Development Lead", "San Francisco, CA", "saved", { fitScore: 75, compMin: 180, compMax: 260, priority: "medium", tier: 2 }),
  opp("d7", "Plaid", "https://plaid.com", "Partner Development Manager", "San Francisco, CA", "rejected", { fitScore: 72, compMin: 200, compMax: 280, priority: "low", tier: 2, interviews: 2 }),
  opp("d8", "Ramp", "https://ramp.com", "Director of Strategic Partnerships", "New York, NY", "offer", { fitScore: 90, compMin: 260, compMax: 380, priority: "high", tier: 1, interviews: 4, source: "referral" }),
  opp("d9", "Scale AI", "https://scale.com", "Enterprise Partnerships Lead", "San Francisco, CA", "applied", { fitScore: 82, compMin: 240, compMax: 340, priority: "medium", tier: 1 }),
  opp("d10", "Watershed", "https://watershed.com", "Head of BD", "San Francisco, CA", "withdrawn", { compMin: 200, compMax: 280, priority: "low", tier: 3, interviews: 1 }),
];

export const DEMO_UPCOMING = [
  { id: "u1", company: "Stripe", round: "Hiring Manager, VP Partnerships", dateTime: days(2) },
  { id: "u2", company: "Figma", round: "Case Study Presentation", dateTime: days(5) },
];

export const DEMO_FOLLOWUPS = [{ id: "f1", company: "Scale AI", role: "Enterprise Partnerships Lead", daysSinceActivity: 6 }];

export const DEMO_ACTIVITY = [
  { id: "a1", description: "Completed panel interview with the Stripe partnerships team", company: "Stripe", role: "Head of Strategic Partnerships", date: days(-1) },
  { id: "a2", description: "Received offer from Ramp: $320K base plus equity", company: "Ramp", role: "Director of Strategic Partnerships", date: days(-2) },
  { id: "a3", description: "Applied with a tailored resume and cover letter", company: "Notion", role: "Strategic Partnerships Lead", date: days(-3) },
  { id: "a4", description: "Completed recruiter screen, strong culture fit signal", company: "Figma", role: "Director of Business Development", date: days(-4) },
  { id: "a5", description: "Reviewed the prep sheet for round two and added two stories", company: "Stripe", role: "Head of Strategic Partnerships", date: days(-5) },
  { id: "a6", description: "Rejected after final round. Feedback: wanted more SaaS experience", company: "Plaid", role: "Partner Development Manager", date: days(-7) },
];

export interface DemoOffer {
  id: string;
  company: string;
  website: string;
  role: string;
  title: string;
  level: string;
  baseComp: number;
  signOnBonus: number;
  annualBonus: number | null;
  bonusPercent: number | null;
  equityType: string;
  equityValue: number;
  vestYears: number;
  vestCliff: number;
  ptoDays: number; // -1 means unlimited
  healthcare: string;
  remotePolicy: string;
  startDate: string;
  expiryDate: string;
  location: string;
  benefits: string;
  aiSummary: string;
}

export const DEMO_OFFERS: DemoOffer[] = [
  {
    id: "o1",
    company: "Stripe",
    website: "https://stripe.com",
    role: "Head of Strategic Partnerships",
    title: "Head of Partnerships, Embedded Finance",
    level: "L6",
    baseComp: 285,
    signOnBonus: 75,
    annualBonus: 85,
    bonusPercent: 30,
    equityType: "RSU",
    equityValue: 320,
    vestYears: 4,
    vestCliff: 12,
    ptoDays: 25,
    healthcare: "Full family coverage, no premium",
    remotePolicy: "Fully remote (US)",
    startDate: "May 15",
    expiryDate: "Apr 30",
    location: "Remote",
    benefits: "$5K home office, $4K learning, 20 weeks parental leave, 401k 5% match",
    aiSummary: "Highest cash and fully remote. Late stage, so more liquid but less upside.",
  },
  {
    id: "o2",
    company: "Ramp",
    website: "https://ramp.com",
    role: "Director of Strategic Partnerships",
    title: "Director, Partnerships",
    level: "D1",
    baseComp: 225,
    signOnBonus: 25,
    annualBonus: 45,
    bonusPercent: 20,
    equityType: "ISO",
    equityValue: 550,
    vestYears: 4,
    vestCliff: 12,
    ptoDays: -1,
    healthcare: "Full coverage, employee only",
    remotePolicy: "NYC hybrid, 4 days in office",
    startDate: "May 20",
    expiryDate: "May 5",
    location: "New York, NY",
    benefits: "$1K home office, $2K learning, 12 weeks parental leave, no 401k match",
    aiSummary: "Largest equity grant and a Director title. Four days in the office is the cost.",
  },
  {
    id: "o3",
    company: "Figma",
    website: "https://figma.com",
    role: "Director of Business Development",
    title: "Director, Platform Partnerships",
    level: "M5",
    baseComp: 240,
    signOnBonus: 40,
    annualBonus: null,
    bonusPercent: null,
    equityType: "RSU",
    equityValue: 480,
    vestYears: 4,
    vestCliff: 12,
    ptoDays: -1,
    healthcare: "Full coverage, all premiums paid",
    remotePolicy: "SF hybrid, 3 days in office",
    startDate: "Jun 1",
    expiryDate: "May 1",
    location: "San Francisco, CA",
    benefits: "$2K home office, $3K learning, 16 weeks parental leave, 401k 6% match",
    aiSummary: "Strong equity upside with a lower base. Three days in San Francisco.",
  },
];

export function demoOfferTotal(o: DemoOffer): number {
  const bonus = o.annualBonus ?? (o.bonusPercent ? Math.round((o.baseComp * o.bonusPercent) / 100) : 0);
  return o.baseComp + bonus + Math.round(o.equityValue / o.vestYears);
}

export const DEMO_ADVICE = `## TL;DR

Stripe is the strongest offer if cash and remote flexibility matter most. Figma wins on equity upside. Ramp is close on paper but the four day office requirement weaks it.

## Compensation comparison

| Offer | Base | Bonus | Equity per year | Estimated annual |
| --- | --- | --- | --- | --- |
| Stripe | $285K | $85K | $80K | about $450K |
| Ramp | $225K | $45K | $138K | about $408K |
| Figma | $240K | none | $120K | about $360K |

## Where each offer wins

- Stripe: highest cash, fully remote, best healthcare and retirement match.
- Ramp: largest grant, a Director title, unlimited PTO.
- Figma: strongest equity trajectory, best learning and parental benefits.

## Where each offer loses

- Stripe: smallest grant, and the IPO timing is not in your control.
- Ramp: no retirement match, weakest healthcare, four days in the office.
- Figma: lowest cash, no bonus plan.

## Questions to ask before deciding

1. Stripe: are the RSUs double trigger? What happens if the IPO slips two years?
2. Ramp: is four days negotiable down to three? What is the promotion timeline?
3. Figma: what was the last 409A, and how often has it been refreshed?

## Negotiation levers

- Ask Figma to lift base toward $260K, citing Stripe.
- Ask Stripe for an extra $150K RSU grant, citing Ramp.
- Ask Ramp for a retirement match and three days in the office.

## Final recommendation

The numbers are close. Let the manager, the team, and the trajectory break the tie, not the comp.`;
