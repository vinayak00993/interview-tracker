import { cx } from "@/components/ui";

/**
 * Brand mark: three stages stepping up to a filled dot, the offer. A
 * terracotta tile with vellum shapes so it reads at 16px and at 180px.
 * Mirrored in src/app/icon.svg and src/app/apple-icon.svg; change all three.
 */
export function LogoMark({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="7" fill="#843728" />
      <g fill="#fcf9f4">
        <rect x="7" y="20" width="7" height="3" rx="1.5" />
        <rect x="7" y="14.5" width="11.5" height="3" rx="1.5" />
        <rect x="7" y="9" width="13" height="3" rx="1.5" />
        <circle cx="23.4" cy="10.5" r="2.7" />
      </g>
    </svg>
  );
}

export function Logo({ size = 24, className = "", wordmark = false }: { size?: number; className?: string; wordmark?: boolean }) {
  if (!wordmark) {
    return (
      <span role="img" aria-label="Interview Tracker" className={cx("inline-flex", className)}>
        <LogoMark size={size} />
      </span>
    );
  }
  return (
    <span className={cx("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      <span className="manuscript-display font-semibold text-ink-900 leading-none whitespace-nowrap" style={{ fontSize: Math.round(size * 0.78) }}>
        Interview Tracker
      </span>
    </span>
  );
}
