"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-label text-ink-600 hover:text-terracotta hover:bg-vellum-high rounded transition-all"
    >
      Sign out
    </button>
  );
}
