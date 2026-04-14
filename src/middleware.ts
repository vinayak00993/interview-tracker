import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory rate limiter for login attempts
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getRateLimitKey(req: NextRequest): string {
  return req.headers.get("x-forwarded-for") || req.ip || "unknown";
}

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Security headers
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  res.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self'; frame-ancestors 'none'"
  );

  // Rate limit login API
  if (req.nextUrl.pathname === "/api/auth/callback/credentials" && req.method === "POST") {
    const key = getRateLimitKey(req);
    const now = Date.now();

    const entry = loginAttempts.get(key);
    if (entry && entry.resetAt > now) {
      if (entry.count >= MAX_LOGIN_ATTEMPTS) {
        return NextResponse.json(
          { error: "Too many login attempts. Try again later." },
          { status: 429 }
        );
      }
      entry.count++;
    } else {
      loginAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    }

    // Cleanup old entries periodically
    if (loginAttempts.size > 1000) {
      loginAttempts.forEach((v, k) => {
        if (v.resetAt < now) loginAttempts.delete(k);
      });
    }
  }

  return res;
}

export const config = {
  matcher: [
    // Apply to all routes except static files and _next
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
