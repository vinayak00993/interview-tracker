"use client";

import { useState } from "react";
import { cx } from "@/components/ui";

const COLORS = ["#843728", "#a24e3d", "#695c4c", "#4c513e", "#88726e", "#b98a3c", "#7a6e85"];

function colorFor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function logoDomain(company: string, website?: string | null): string {
  if (website) {
    try {
      return new URL(website).hostname;
    } catch {
      return website.replace(/^https?:\/\//, "").split("/")[0];
    }
  }
  return company.replace(/\s*\(.*?\)\s*/g, "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase() + ".com";
}

/** Company favicon with a tinted-initial fallback that paints instantly. */
export function CompanyAvatar({ company, website, size = 32, className = "" }: { company: string; website?: string | null; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const initial = company.charAt(0).toUpperCase();
  const color = colorFor(company);
  const src = `https://www.google.com/s2/favicons?domain=${logoDomain(company, website)}&sz=128`;

  return (
    <div
      className={cx("relative rounded flex items-center justify-center font-serif font-medium text-vellum shrink-0 overflow-hidden", className)}
      style={{ width: size, height: size, backgroundColor: color, fontSize: Math.max(11, size * 0.38) }}
    >
      <span className="absolute inset-0 flex items-center justify-center">{initial}</span>
      {!failed && (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          width={size}
          height={size}
          className="relative z-10 rounded object-contain bg-vellum-lowest"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
