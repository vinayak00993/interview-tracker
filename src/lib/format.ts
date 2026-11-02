import { parseStoredDate } from "@/lib/time";

const SHORT: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
const LONG: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" };
const FULL: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" };

export function formatDate(value: string | null | undefined, style: "short" | "long" | "full" = "short"): string {
  const d = parseStoredDate(value);
  if (!d) return "";
  return d.toLocaleDateString("en-US", style === "short" ? SHORT : style === "long" ? LONG : FULL);
}

/** Value for <input type="datetime-local"> in the viewer's local time. */
export function toLocalInputValue(value: string | null | undefined): string {
  const d = parseStoredDate(value);
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function toDateInputValue(value: string | null | undefined): string {
  return toLocalInputValue(value).slice(0, 10);
}

/** "in 2 days", "3 days ago", "today". */
export function relativeDays(value: string | null | undefined): string {
  const d = parseStoredDate(value);
  if (!d) return "";
  const diff = Math.round((d.getTime() - Date.now()) / 86_400_000);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  return diff > 0 ? `in ${diff} days` : `${-diff} days ago`;
}
