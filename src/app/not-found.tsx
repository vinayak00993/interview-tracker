import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-vellum">
      <div className="text-center max-w-sm animate-fade-in-up">
        <div className="flex justify-center mb-5">
          <Logo size={40} />
        </div>
        <p className="manuscript-label">404</p>
        <h1 className="manuscript-display text-3xl font-semibold text-ink-900 mt-1">This page is not in the pipeline.</h1>
        <p className="text-sm font-serif italic text-ink-700 mt-3">It may have been moved, archived, or never existed.</p>
        <div className="flex justify-center gap-2 mt-6">
          <LinkButton href="/" variant="ghost">Home</LinkButton>
          <LinkButton href="/dashboard" variant="primary">Open the dashboard</LinkButton>
        </div>
      </div>
    </div>
  );
}
