/**
 * Zod schemas for every write that enters the app, shared by the REST
 * routes and the server actions. Form values arrive as strings, so the
 * numeric fields coerce and treat "" as "not provided".
 */
import { z } from "zod";

export const OPPORTUNITY_STATUSES = ["saved", "applied", "interviewing", "offer", "rejected", "withdrawn", "archived"] as const;
export const PRIORITIES = ["high", "medium", "low"] as const;
export const SOURCES = ["direct", "recruiter", "referral", "job_board"] as const;
export const INTERVIEW_FORMATS = ["phone", "video", "onsite", "async"] as const;
export const INTERVIEW_STATUSES = ["scheduled", "completed", "cancelled", "rescheduled"] as const;
export const SENTIMENTS = ["positive", "neutral", "negative"] as const;
export const CONTACT_TYPES = ["recruiter", "hiring_manager", "referral", "peer", "mentor", "other"] as const;
export const WARMTH = ["cold", "warm", "hot"] as const;
export const DOCUMENT_TYPES = ["resume", "cover_letter", "portfolio", "references", "other"] as const;
export const ACTIVITY_TYPES = ["applied", "emailed", "interviewed", "followed_up", "researched", "offer_received", "rejected", "withdrew", "note", "status_change"] as const;

export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

/** Shared field helpers. Form values arrive as strings, so "" means "not provided". */
const blank = z.union([z.literal(""), z.undefined()]);

/** Optional trimmed string; "" is treated as not provided. */
const optStr = (max = 2000) =>
  z.union([blank, z.string().trim().max(max)]).transform((v): string | undefined => (v === "" ? undefined : v));
/** Nullable string for updates; "" clears the field. */
const nullStr = (max = 2000) =>
  z.union([blank, z.null(), z.string().trim().max(max)]).transform((v): string | null | undefined => (v === "" ? null : v));
const nullInt = (min: number, max: number) =>
  z
    .union([blank, z.null(), z.coerce.number().int().min(min).max(max)])
    .transform((v): number | null | undefined => (v === "" ? null : v));
const nullFloat = z.union([blank, z.null(), z.coerce.number()]).transform((v): number | null | undefined => (v === "" ? null : v));
const bool = z
  .union([z.boolean(), z.string(), z.number(), z.null(), z.undefined()])
  .transform((v): boolean => v === true || v === 1 || v === "true" || v === "on" || v === "1");
const nullUrl = z
  .union([blank, z.null(), z.string().trim().url().max(2000)])
  .transform((v): string | null | undefined => (v === "" ? null : v));
const nullIsoDate = z
  .union([blank, z.null(), z.string().trim().max(40)])
  .transform((v): string | null | undefined => (v === "" ? null : v));
/** Enum with a default; "" or undefined falls back to the default. */
const enumWithDefault = <T extends readonly [string, ...string[]]>(values: T, fallback: T[number]) =>
  z.union([blank, z.enum(values)]).transform((v): T[number] => (v === "" || v === undefined ? fallback : v));
/** Nullable enum; "" clears the field. */
const nullEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.union([blank, z.null(), z.enum(values)]).transform((v): T[number] | null | undefined => (v === "" ? null : v));

void optStr;

export const opportunityCreateSchema = z.object({
  company: z.string().trim().min(1).max(200),
  role: z.string().trim().min(1).max(200),
  jdLink: nullUrl,
  jdText: nullStr(20000),
  website: nullUrl,
  compMin: nullInt(0, 100000),
  compMax: nullInt(0, 100000),
  location: nullStr(200),
  remote: bool.default(false),
  fitScore: nullInt(0, 100),
  priority: enumWithDefault(PRIORITIES, "medium"),
  tier: nullInt(1, 3),
  status: enumWithDefault(OPPORTUNITY_STATUSES, "saved"),
  appliedDate: nullIsoDate,
  source: z
    .union([blank, z.null(), z.literal("job board"), z.enum(SOURCES)])
    .transform((v): (typeof SOURCES)[number] | null | undefined => (v === "" ? null : v === "job board" ? "job_board" : v)),
  followUpAt: nullIsoDate,
  notes: nullStr(20000),
  prosConsNotes: nullStr(20000),
  keyGaps: nullStr(20000),
});
export type OpportunityCreateInput = z.infer<typeof opportunityCreateSchema>;

export const opportunityUpdateSchema = opportunityCreateSchema.partial().extend({
  company: z.string().trim().min(1).max(200).optional(),
  role: z.string().trim().min(1).max(200).optional(),
});
export type OpportunityUpdateInput = z.infer<typeof opportunityUpdateSchema>;

export const statusChangeSchema = z.object({
  status: z.enum(OPPORTUNITY_STATUSES),
});

export const followUpSchema = z.object({
  followUpAt: nullIsoDate,
});

export const interviewCreateSchema = z.object({
  opportunityId: z.string().min(1),
  round: z.string().trim().min(1).max(200),
  roundNumber: z.union([blank, z.coerce.number().int().min(1).max(50)]).transform((v): number => (v === "" || v === undefined ? 1 : v)),
  dateTime: nullIsoDate,
  durationMin: nullInt(1, 1440),
  format: enumWithDefault(INTERVIEW_FORMATS, "video"),
  interviewerName: nullStr(200),
  interviewerTitle: nullStr(200),
  interviewerLinkedIn: nullUrl,
  prepNotes: nullStr(20000),
  debriefNotes: nullStr(20000),
  questionsAsked: nullStr(20000),
  questionsToAsk: nullStr(20000),
  status: enumWithDefault(INTERVIEW_STATUSES, "scheduled"),
  sentiment: nullEnum(SENTIMENTS),
  nextSteps: nullStr(5000),
});
export type InterviewCreateInput = z.infer<typeof interviewCreateSchema>;

export const interviewUpdateSchema = interviewCreateSchema.omit({ opportunityId: true }).partial().extend({
  round: z.string().trim().min(1).max(200).optional(),
});
export type InterviewUpdateInput = z.infer<typeof interviewUpdateSchema>;

export const debriefSchema = z.object({
  debriefNotes: nullStr(20000),
  questionsAsked: nullStr(20000),
  sentiment: nullEnum(SENTIMENTS),
  nextSteps: nullStr(5000),
});

export const contactCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  title: nullStr(200),
  company: nullStr(200),
  email: z
    .union([blank, z.null(), z.string().trim().email().max(320)])
    .transform((v): string | null | undefined => (v === "" ? null : v)),
  phone: nullStr(50),
  linkedIn: nullUrl,
  type: enumWithDefault(CONTACT_TYPES, "other"),
  warmth: nullEnum(WARMTH),
  notes: nullStr(5000),
  lastContactedAt: nullIsoDate,
});
export type ContactCreateInput = z.infer<typeof contactCreateSchema>;
export const contactUpdateSchema = contactCreateSchema.partial().extend({
  name: z.string().trim().min(1).max(200).optional(),
});
export type ContactUpdateInput = z.infer<typeof contactUpdateSchema>;

export const attachContactSchema = z.object({
  contactId: z.string().min(1),
  role: nullStr(100),
});

export const documentCreateSchema = z.object({
  type: enumWithDefault(DOCUMENT_TYPES, "other"),
  name: z.string().trim().min(1).max(200),
  version: nullStr(50),
  notes: nullStr(5000),
  filePath: nullStr(1000),
});
export type DocumentCreateInput = z.infer<typeof documentCreateSchema>;
export const documentUpdateSchema = documentCreateSchema.partial().extend({
  name: z.string().trim().min(1).max(200).optional(),
});

export const activityCreateSchema = z.object({
  opportunityId: z.string().min(1).nullable().optional(),
  type: z.enum(ACTIVITY_TYPES),
  description: z.string().trim().min(1).max(2000),
  date: nullIsoDate,
});

export const offerUpsertSchema = z.object({
  opportunityId: z.string().min(1),
  baseComp: nullInt(0, 100000),
  signOnBonus: nullInt(0, 100000),
  annualBonus: nullInt(0, 100000),
  bonusPercent: nullFloat,
  equityType: nullStr(50),
  equityValue: nullInt(0, 1000000),
  equityShares: nullInt(0, 1000000000),
  vestYears: nullInt(0, 20),
  vestCliff: nullInt(0, 120),
  vestSchedule: nullStr(200),
  ptoDays: nullInt(-1, 365),
  healthcare: nullStr(500),
  remotePolicy: nullStr(500),
  startDate: nullStr(100),
  expiryDate: nullStr(100),
  location: nullStr(200),
  title: nullStr(200),
  level: nullStr(100),
  benefits: nullStr(5000),
  rawText: nullStr(50000),
  sourceType: nullStr(50),
  aiSummary: nullStr(2000),
});
export type OfferUpsertInput = z.infer<typeof offerUpsertSchema>;

export const profileUpdateSchema = z.object({
  resumeText: nullStr(100000),
  linkedInAbout: nullStr(20000),
  linkedInUrl: nullUrl,
});

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  password: z.string().min(8).max(200),
  name: z.string().trim().min(1).max(200),
});

export const parseJdSchema = z.object({
  url: z.string().trim().url().max(2000),
});

export const aiPrepSchema = z.object({
  opportunityId: z.string().min(1),
  interviewId: z.string().min(1).nullable().optional(),
});

export const aiFollowUpSchema = z.object({
  interviewId: z.string().min(1),
});

/** Turns a Zod error into a short, user-facing message. */
export function formatZodError(error: z.ZodError): string {
  return error.issues
    .slice(0, 3)
    .map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message))
    .join("; ");
}
