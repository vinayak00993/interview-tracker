/**
 * TEMPORARY diagnostic endpoint — reveals whether Google OAuth env vars
 * are present in the running container. Redacts secrets. Delete this file
 * once the OAuth invalid_client bug is fixed.
 *
 * Usage: curl https://www.unlaidoff.com/api/_debug/env-check
 */
import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const nextauthUrl = process.env.NEXTAUTH_URL || "";
  const nextauthSecret = process.env.NEXTAUTH_SECRET || "";

  return NextResponse.json({
    GOOGLE_CLIENT_ID: {
      present: clientId.length > 0,
      length: clientId.length,
      first12: clientId.slice(0, 12),
      last25: clientId.slice(-25), // reveals the .apps.googleusercontent.com suffix
      trimmedMatchesOriginal: clientId === clientId.trim(),
    },
    GOOGLE_CLIENT_SECRET: {
      present: clientSecret.length > 0,
      length: clientSecret.length,
      startsWithGocspx: clientSecret.startsWith("GOCSPX-"),
      trimmedMatchesOriginal: clientSecret === clientSecret.trim(),
    },
    NEXTAUTH_URL: {
      present: nextauthUrl.length > 0,
      value: nextauthUrl,
    },
    NEXTAUTH_SECRET: {
      present: nextauthSecret.length > 0,
      length: nextauthSecret.length,
    },
    nodeEnv: process.env.NODE_ENV,
  });
}
