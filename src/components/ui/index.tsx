/**
 * Small set of UI primitives in the Earthen Manuscript style. Keep these
 * dumb: layout and colour only, no data fetching.
 */
import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ---------- typography ---------- */

export function Label({ children, className = "", htmlFor }: { children: ReactNode; className?: string; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className={cx("manuscript-label block mb-1.5", className)}>
      {children}
    </label>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={cx("manuscript-label", className)}>{children}</p>;
}

export function PageTitle({ eyebrow, title, description, actions }: { eyebrow?: string; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-6 sm:mb-8 gap-3 flex-wrap">
      <div className="min-w-0">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="manuscript-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-ink-900 mt-1 leading-tight">{title}</h1>
        {description && <p className="text-sm font-serif italic text-ink-700 mt-2 max-w-xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function SectionTitle({ children, action, className = "" }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cx("flex items-center justify-between mb-3", className)}>
      <h2 className="manuscript-label">{children}</h2>
      {action}
    </div>
  );
}

/* ---------- surfaces ---------- */

export function Card({ children, className = "", tone = "paper" }: { children: ReactNode; className?: string; tone?: "paper" | "low" | "glass" | "accent" | "sage" }) {
  const tones = {
    paper: "bg-vellum-lowest shadow-card",
    low: "bg-vellum-low",
    glass: "manuscript-glass bg-vellum-lowest/85 shadow-elevated",
    accent: "bg-terracotta/5",
    sage: "bg-sage/10",
  };
  return <div className={cx("rounded-lg p-4 sm:p-5", tones[tone], className)}>{children}</div>;
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="text-center py-10 px-4">
      <p className="font-serif italic text-ink-700">{title}</p>
      {hint && <p className="text-xs text-ink-600 mt-1.5 max-w-sm mx-auto">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Badge({ children, className = "", title }: { children: ReactNode; className?: string; title?: string }) {
  return (
    <span title={title} className={cx("inline-flex items-center text-[10px] font-semibold uppercase tracking-label px-2 py-0.5 rounded", className)}>
      {children}
    </span>
  );
}

export function Divider({ className = "" }: { className?: string }) {
  return <div className={cx("h-px bg-gradient-to-r from-transparent via-vellum-high to-transparent", className)} />;
}

/* ---------- controls ---------- */

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-terracotta hover:bg-terracotta-deep text-vellum shadow-card hover:shadow-lift hover:-translate-y-0.5",
  secondary: "bg-umber-soft text-umber hover:bg-terracotta hover:text-vellum",
  ghost: "text-ink-700 hover:text-terracotta hover:bg-vellum-high",
  danger: "text-ink-600 hover:text-terracotta hover:bg-terracotta/5",
};
const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-[11px]",
  md: "px-4 py-2 text-[11px]",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cx(
        "inline-flex items-center justify-center gap-2 font-semibold uppercase tracking-label rounded transition-all disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function LinkButton({ href, variant = "ghost", size = "md", className = "", children }: { href: string; variant?: Variant; size?: Size; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={cx("inline-flex items-center justify-center gap-2 font-semibold uppercase tracking-label rounded transition-all whitespace-nowrap", VARIANTS[variant], SIZES[size], className)}>
      {children}
    </Link>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return <span className={cx("inline-block w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin", className)} aria-hidden="true" />;
}

const FIELD = "w-full px-0 py-1.5 bg-transparent text-ink-900 text-sm font-body focus:outline-none border-b border-outlineSoft focus:border-terracotta transition-colors placeholder:text-ink-600";

export function Input({ className = "", ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={cx(FIELD, className)} />;
}

export function Select({ className = "", children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className={cx(FIELD, "cursor-pointer", className)}>
      {children}
    </select>
  );
}

export function Textarea({ className = "", ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...rest}
      className={cx("w-full px-3 py-2 bg-vellum-low text-ink-900 text-sm font-body focus:outline-none focus:bg-vellum-lowest border-b border-outlineSoft focus:border-terracotta transition-all resize-y rounded-t placeholder:text-ink-600", className)}
    />
  );
}

export function Field({ label, htmlFor, children, hint, className = "" }: { label: ReactNode; htmlFor?: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-ink-600 mt-1">{hint}</p>}
    </div>
  );
}

export function Checkbox({ label, className = "", ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className={cx("flex items-center gap-2 text-sm text-ink-900 cursor-pointer", className)}>
      <input type="checkbox" {...rest} className="rounded accent-terracotta" />
      {label}
    </label>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="text-terracotta text-xs font-serif italic">{children}</p>;
}

export function SuccessText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="text-sage text-xs font-serif italic">{children}</p>;
}
