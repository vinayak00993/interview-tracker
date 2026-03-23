"use client";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  saved: { bg: "bg-pipeline-saved-bg", text: "text-pipeline-saved-light", label: "Saved" },
  applied: { bg: "bg-pipeline-applied-bg", text: "text-pipeline-applied-light", label: "Applied" },
  interviewing: { bg: "bg-pipeline-interviewing-bg", text: "text-pipeline-interviewing-light", label: "Interviewing" },
  offer: { bg: "bg-pipeline-offer-bg", text: "text-pipeline-offer-light", label: "Offer" },
  rejected: { bg: "bg-pipeline-rejected-bg", text: "text-pipeline-rejected-light", label: "Rejected" },
  withdrawn: { bg: "bg-pipeline-withdrawn-bg", text: "text-pipeline-withdrawn-light", label: "Withdrawn" },
};

const FALLBACK_STYLE = { bg: "bg-[#1f2937]", text: "text-[#9ca3af]", label: "" };

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const style = STATUS_STYLES[status.toLowerCase()] ?? FALLBACK_STYLE;
  const label = style.label || status;

  const sizeClasses = size === "sm"
    ? "px-2 py-0.5 text-xs"
    : "px-2.5 py-1 text-sm";

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${style.bg} ${style.text} ${sizeClasses}
      `}
    >
      <span
        className={`
          mr-1.5 inline-block rounded-full
          ${size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2"}
        `}
        style={{
          backgroundColor: "currentColor",
        }}
      />
      {label}
    </span>
  );
}
