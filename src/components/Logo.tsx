/**
 * Interview Tracker brand mark — a serif capital "I" in vellum carved out
 * of a terracotta rounded square. Scales cleanly from 16px (favicon) to
 * 180px (apple-touch-icon) and anywhere in between.
 */
export function Logo({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      aria-label="Interview Tracker"
      role="img"
    >
      <rect width="32" height="32" rx="6" fill="#843728" />
      <g fill="#fcf9f4">
        <rect x="10" y="9" width="12" height="2.5" rx="0.5" />
        <rect x="14.5" y="11.5" width="3" height="9" />
        <rect x="10" y="20.5" width="12" height="2.5" rx="0.5" />
      </g>
    </svg>
  );
}
