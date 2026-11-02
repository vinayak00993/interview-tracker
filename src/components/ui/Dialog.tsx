"use client";

import { useEffect, type ReactNode } from "react";
import { cx } from "./index";

/**
 * Frosted modal on desktop, bottom sheet on phones. Locks body scroll and
 * closes on Escape or backdrop tap.
 */
export function Dialog({
  open,
  onClose,
  title,
  eyebrow,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  eyebrow?: string;
  children: ReactNode;
  size?: "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 w-full bg-ink-900/40 animate-fade-in" />
      <div
        className={cx(
          "relative w-full manuscript-glass bg-vellum-lowest/95 shadow-elevated rounded-t-xl sm:rounded-lg animate-sheet-up sm:animate-scale-in max-h-[92vh] flex flex-col",
          size === "lg" ? "sm:max-w-3xl" : "sm:max-w-xl",
          "sm:mx-4"
        )}
      >
        <div className="sm:hidden w-9 h-1 rounded-full bg-vellum-highest mx-auto mt-3" aria-hidden="true" />
        <div className="flex items-start justify-between px-5 sm:px-6 pt-4 sm:pt-5 pb-3">
          <div>
            {eyebrow && <p className="manuscript-label">{eyebrow}</p>}
            <h2 className="manuscript-display text-lg font-semibold text-ink-900 mt-0.5">{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-600 hover:text-terracotta text-xl leading-none w-8 h-8 -mr-2 flex items-center justify-center rounded">
            ×
          </button>
        </div>
        <div className="px-5 sm:px-6 pb-6 overflow-y-auto safe-bottom">{children}</div>
      </div>
    </div>
  );
}
