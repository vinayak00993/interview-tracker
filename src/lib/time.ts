/** ISO 8601 UTC timestamp. All timestamps in the database are strings. */
export function nowIso(): string {
  return new Date().toISOString();
}

/** Parse a stored timestamp. Older rows use SQLite's "YYYY-MM-DD HH:MM:SS" form. */
export function parseStoredDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) ? value.replace(" ", "T") + "Z" : value;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function daysBetween(from: Date, to: Date = new Date()): number {
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000);
}
