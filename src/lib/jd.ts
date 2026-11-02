/**
 * Job description helpers: turn a careers page into plain text and pull
 * out the fields the add form can prefill.
 */
import { safeFetch } from "@/lib/safe-fetch";

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'", nbsp: " " };

export function htmlToText(html: string, maxLength = 12000): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6]|br|tr|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#?\w+);/g, (m, code: string) => ENTITIES[code] ?? " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim()
    .slice(0, maxLength);
}

export interface ParsedJobPosting {
  jdLink: string;
  company?: string;
  role?: string;
  website?: string;
  location?: string;
  remote?: boolean;
  compMin?: number;
  compMax?: number;
  jdText: string;
}

const JOB_BOARDS =
  /linkedin\.com|greenhouse\.io|lever\.co|workday\.com|myworkdayjobs\.com|indeed\.com|glassdoor\.com|ashbyhq\.com|workable\.com|jobscore\.com|angel\.co|wellfound\.com|smartrecruiters\.com|icims\.com/i;

function attr(html: string, pattern: RegExp): string | undefined {
  const m = html.match(pattern);
  return m?.[1]?.trim() || undefined;
}

export function extractJobPosting(html: string, url: string): ParsedJobPosting {
  const text = htmlToText(html);
  const result: ParsedJobPosting = { jdLink: url, jdText: text };

  // JSON-LD JobPosting is the most reliable source when present.
  const ldBlocks = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const block of ldBlocks) {
    try {
      const parsed = JSON.parse(block[1]);
      const candidates = Array.isArray(parsed) ? parsed : [parsed, ...(parsed["@graph"] ?? [])];
      const job = candidates.find((j) => j && j["@type"] === "JobPosting");
      if (!job) continue;
      result.role = job.title || result.role;
      result.company = job.hiringOrganization?.name || result.company;
      result.website = job.hiringOrganization?.sameAs || job.hiringOrganization?.url || result.website;
      const addr = job.jobLocation?.address ?? (Array.isArray(job.jobLocation) ? job.jobLocation[0]?.address : undefined);
      if (addr?.addressLocality) {
        result.location = `${addr.addressLocality}${addr.addressRegion ? ", " + addr.addressRegion : ""}`;
      }
      if (job.jobLocationType === "TELECOMMUTE" || /remote/i.test(String(job.jobLocationType ?? ""))) result.remote = true;
      const salary = job.baseSalary?.value;
      if (salary?.minValue) result.compMin = Math.round(Number(salary.minValue) / 1000);
      if (salary?.maxValue) result.compMax = Math.round(Number(salary.maxValue) / 1000);
      if (typeof job.description === "string" && job.description.length > text.length / 2) {
        result.jdText = htmlToText(job.description);
      }
      break;
    } catch {
      // ignore malformed JSON-LD
    }
  }

  if (!result.company) result.company = attr(html, /property="og:site_name"\s+content="([^"]+)"/i);

  if (!result.website) {
    const source = attr(html, /property="og:url"\s+content="([^"]+)"/i) || attr(html, /<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i) || url;
    if (!JOB_BOARDS.test(source)) {
      try {
        const parsed = new URL(source);
        result.website = `${parsed.protocol}//${parsed.hostname}`;
      } catch {
        // ignore
      }
    }
  }

  if (!result.role) {
    const rawTitle = attr(html, /property="og:title"\s+content="([^"]+)"/i) || attr(html, /<title>([^<]+)<\/title>/i) || "";
    const parts = rawTitle.split(/\s*[-|–—]\s*/);
    if (parts[0]) result.role = parts[0].trim();
    if (!result.company && parts.length > 1) {
      result.company = parts[parts.length - 1].replace(/careers|jobs|hiring/gi, "").trim() || undefined;
    }
  }

  if (!result.location) {
    const loc = text.match(/(?:location|office|based in)[:\s]+([A-Z][a-zA-Z\s]+,\s*[A-Z]{2})/i);
    if (loc) result.location = loc[1].trim();
  }
  if (result.remote === undefined && /\bremote\b/i.test(text.slice(0, 2000))) result.remote = true;

  if (!result.compMin && !result.compMax) {
    const patterns = [
      /\$\s*([\d,]+)\s*(?:\/\s*(?:yr|year|annually))?\s*[-–—~]|to\s*\$\s*([\d,]+)/i,
      /\$\s*([\d,]+)\s*(?:\/\s*(?:yr|year|annually))?\s*(?:[-–—~]|to)\s*\$\s*([\d,]+)/i,
      /\$\s*(\d+)\s*[kK]\s*(?:[-–—~]|to)\s*\$?\s*(\d+)\s*[kK]/,
      /USD\s*([\d,]+)\s*(?:[-–—~]|to)\s*(?:USD\s*)?([\d,]+)/i,
    ];
    for (const pattern of patterns) {
      const m = text.match(pattern);
      if (!m || !m[1] || !m[2]) continue;
      let min = parseInt(m[1].replace(/,/g, ""), 10);
      let max = parseInt(m[2].replace(/,/g, ""), 10);
      if (min > 1000) min = Math.round(min / 1000);
      if (max > 1000) max = Math.round(max / 1000);
      if (min >= 10 && max >= min && max <= 2000) {
        result.compMin = min;
        result.compMax = max;
        break;
      }
    }
  }

  return result;
}

/** Fetches and parses a job posting URL. Throws UnsafeUrlError for bad hosts. */
export async function fetchJobPosting(url: string): Promise<ParsedJobPosting> {
  const res = await safeFetch(url, { timeoutMs: 8000 });
  if (!res.ok) throw new Error(`Could not load that page (HTTP ${res.status})`);
  return extractJobPosting(res.text, res.finalUrl);
}
