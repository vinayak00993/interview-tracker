"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  const handleRegister = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Valid email is required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Auto sign-in after successful registration
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Account created but sign-in failed. Please sign in manually.");
        setIsRegister(false);
        setLoading(false);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Registration failed. Please try again.");
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError("");
  };

  const inputCls = "w-full px-0 py-2 bg-transparent text-ink-900 text-sm focus:outline-none border-b border-outlineSoft focus:border-terracotta transition-colors placeholder:text-ink-600";

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="text-center mb-10">
          <h1 className="manuscript-display text-4xl font-semibold tracking-tight text-ink-900">
            Interview Tracker
          </h1>
          <p className="text-sm text-ink-700 mt-3 animate-fade-in-up-delay-1">
            {isRegister ? "Create your account." : "Welcome back. Sign in to continue."}
          </p>
        </div>

        <div className="space-y-5 bg-vellum-lowest rounded-lg p-7 shadow-elevated">
          {/* Google OAuth — primary path for new signups */}
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 bg-vellum border border-vellum-high hover:bg-vellum-low disabled:opacity-50 text-ink-900 text-sm font-medium rounded transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 text-[10px] uppercase tracking-label text-ink-600">
            <span className="h-px flex-1 bg-vellum-high" />
            <span>or</span>
            <span className="h-px flex-1 bg-vellum-high" />
          </div>

          {isRegister && (
            <div>
              <label className="manuscript-label block mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
                placeholder="Your name"
              />
            </div>
          )}

          <div>
            <label className="manuscript-label block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              placeholder="you@email.com"
            />
          </div>

          <div>
            <label className="manuscript-label block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              placeholder="••••••••"
            />
          </div>

          {isRegister && (
            <div>
              <label className="manuscript-label block mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputCls}
                placeholder="••••••••"
              />
            </div>
          )}

          {error && (
            <p className="text-terracotta text-xs font-serif italic">{error}</p>
          )}

          <button
            onClick={isRegister ? handleRegister : handleSignIn}
            disabled={loading}
            className="w-full py-3 bg-terracotta hover:bg-terracotta-deep disabled:opacity-50 text-vellum text-[11px] font-semibold uppercase tracking-label rounded shadow-card hover:shadow-lift hover:-translate-y-0.5 transition-all"
          >
            {loading
              ? (isRegister ? "Creating..." : "Signing in...")
              : (isRegister ? "Begin Archive" : "Sign In")}
          </button>

          <p className="text-center text-xs text-ink-600">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={toggleMode}
              className="text-terracotta hover:text-terracotta-deep font-semibold underline underline-offset-2 transition-colors"
            >
              {isRegister ? "Sign in" : "Create account"}
            </button>
          </p>

          <div className="pt-4 border-t border-vellum-high">
            <Link
              href="/demo"
              className="block w-full text-center py-2.5 text-[11px] font-semibold uppercase tracking-label text-ink-700 hover:text-terracotta hover:bg-vellum-low rounded transition-all"
            >
              See a live demo
            </Link>
          </div>
        </div>
      </div>

      {/* Decorative background warmth */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-terracotta/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-sage/10 blur-3xl" />
      </div>
    </div>
  );
}
