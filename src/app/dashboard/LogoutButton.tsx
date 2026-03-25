"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="px-3 py-1.5 text-xs font-medium text-warm-500 hover:text-warm-900 border border-warm-300/60 hover:border-warm-400 rounded-lg hover:shadow-card hover:-translate-y-px transition-all duration-200"
    >
      Sign out
    </button>
  );
}
