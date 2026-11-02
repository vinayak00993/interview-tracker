/** Shared display config for pipeline stages, priorities and sentiments. */
import type { OpportunityStatus } from "@/lib/validation";

export interface StageConfig {
  status: OpportunityStatus;
  label: string;
  /** Column background tint. */
  surface: string;
  /** Stage label colour. */
  accent: string;
  /** Count chip. */
  chip: string;
  /** Marker dot. */
  marker: string;
  /** Solid badge (bg + text) for the detail header. */
  badge: string;
}

export const STAGES: StageConfig[] = [
  { status: "saved",        label: "Saved",        surface: "bg-[#efe9df]", accent: "text-ink-700",    chip: "bg-vellum-high text-ink-700", marker: "bg-ink-400",      badge: "bg-vellum-high text-ink-700" },
  { status: "applied",      label: "Applied",      surface: "bg-[#f3e8d1]", accent: "text-umber",      chip: "bg-umber-soft text-umber",    marker: "bg-[#c59a3a]",    badge: "bg-umber-soft text-umber" },
  { status: "interviewing", label: "Interviewing", surface: "bg-[#ecd9d2]", accent: "text-terracotta", chip: "bg-terracotta text-vellum",   marker: "bg-terracotta",   badge: "bg-terracotta text-vellum" },
  { status: "offer",        label: "Offer",        surface: "bg-[#dfe6c9]", accent: "text-sage",       chip: "bg-sage/15 text-sage",        marker: "bg-sage",         badge: "bg-sage text-vellum" },
  { status: "rejected",     label: "Rejected",     surface: "bg-[#ecdbd6]", accent: "text-ink-700",    chip: "bg-vellum-high text-ink-700", marker: "bg-[#a86656]",    badge: "bg-vellum-mid text-ink-600" },
  { status: "withdrawn",    label: "Withdrawn",    surface: "bg-[#e6e0d3]", accent: "text-ink-700",    chip: "bg-vellum-high text-ink-700", marker: "bg-ink-300",      badge: "bg-vellum-mid text-ink-600" },
];

/** Archived is a terminal state that does not get its own column. */
export const ALL_STATUSES: { status: OpportunityStatus; label: string }[] = [
  ...STAGES.map((s) => ({ status: s.status, label: s.label })),
  { status: "archived", label: "Archived" },
];

export function stageFor(status: string): StageConfig {
  return STAGES.find((s) => s.status === status) ?? { ...STAGES[0], status: "archived" as OpportunityStatus, label: "Archived" };
}

export const PRIORITY_DOT: Record<string, string> = {
  high: "bg-terracotta",
  medium: "bg-umber",
  low: "bg-ink-400",
};

export const PRIORITY_BORDER: Record<string, string> = {
  high: "border-l-terracotta",
  medium: "border-l-[#c59a3a]",
  low: "border-l-ink-300",
};

export const SENTIMENT_TEXT: Record<string, string> = {
  positive: "text-sage",
  neutral: "text-umber",
  negative: "text-terracotta",
};

export const INTERVIEW_STATUS_BADGE: Record<string, string> = {
  scheduled: "bg-terracotta text-vellum",
  completed: "bg-sage text-vellum",
  cancelled: "bg-vellum-high text-ink-700",
  rescheduled: "bg-umber-soft text-umber",
};

export const WARMTH_BADGE: Record<string, string> = {
  hot: "bg-terracotta/10 text-terracotta",
  warm: "bg-umber-soft text-umber",
  cold: "bg-vellum-high text-ink-700",
};

export const ACTIVITY_BADGE: Record<string, string> = {
  interviewed: "bg-terracotta/10 text-terracotta",
  applied: "bg-umber-soft text-umber",
  offer_received: "bg-sage/15 text-sage",
  status_change: "bg-vellum-high text-ink-700",
  followed_up: "bg-sage/15 text-sage",
  emailed: "bg-umber-soft text-umber",
};

export function humanize(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function formatComp(min: number | null, max: number | null): string | null {
  if (min != null && max != null) return `$${min}K to $${max}K`;
  if (min != null) return `From $${min}K`;
  if (max != null) return `Up to $${max}K`;
  return null;
}

/** "Austin, TX · Remote", without doubling up when the location already says remote. */
export function formatLocation(location: string | null | undefined, remote: boolean): string {
  const loc = (location ?? "").trim();
  if (!remote) return loc;
  if (!loc) return "Remote";
  return /remote/i.test(loc) ? loc : `${loc} · Remote`;
}
