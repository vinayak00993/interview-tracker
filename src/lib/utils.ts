/**
 * Formats a date as "March 31, 2026" style.
 * Accepts a Date object, ISO string, or timestamp number.
 */
export function formatDate(date: Date | string | number): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
