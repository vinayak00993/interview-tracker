"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Button, Field, Input, ErrorText } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError(result.error.startsWith("Too many") ? result.error : "Invalid email or password");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  const handleRegister = async () => {
    setError("");
    if (!name.trim()) return setError("Name is required");
    if (!email.trim() || !email.includes("@")) return setError("A valid email is required");
    if (password.length < 8) return setError("Password must be at least 8 characters");
    if (password !== confirmPassword) return setError("Passwords do not match");

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
      const signInResult = await signIn("credentials", { email, password, redirect: false });
      if (signInResult?.error) {
        setError("Account created but sign-in failed. Please sign in.");
        setIsRegister(false);
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Registration failed. Please try again.");
      setLoading(false);
    }
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    void (isRegister ? handleRegister() : handleSignIn());
  };

  return (
    <div className="min-h-screen flex flex-col px-4 bg-vellum">
      <div className="pt-5">
        <Link href="/" className="inline-block text-[11px] font-semibold uppercase tracking-label text-ink-600 hover:text-terracotta transition-colors">
          ← Back to home
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center py-10">
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-5">
              <Logo size={40} wordmark />
            </div>
            <p className="text-sm font-serif italic text-ink-700">{isRegister ? "Create your account." : "Welcome back. Sign in to continue."}</p>
          </div>

          <form onSubmit={submit} className="space-y-5 bg-vellum-lowest rounded-lg p-7 shadow-elevated">
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
              <Field label="Name" htmlFor="name">
                <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" />
              </Field>
            )}
            <Field label="Email" htmlFor="email">
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" autoComplete="email" />
            </Field>
            <Field label="Password" htmlFor="password">
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete={isRegister ? "new-password" : "current-password"} />
            </Field>
            {isRegister && (
              <Field label="Confirm password" htmlFor="confirm">
                <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
              </Field>
            )}

            <ErrorText>{error}</ErrorText>

            <Button type="submit" loading={loading} className="w-full py-3">
              {isRegister ? "Create account" : "Sign in"}
            </Button>

            <p className="text-center text-xs text-ink-600">
              {isRegister ? "Already have an account?" : "No account yet?"}{" "}
              <button type="button" onClick={() => { setIsRegister(!isRegister); setError(""); }} className="text-terracotta hover:text-terracotta-deep font-semibold underline underline-offset-2 transition-colors">
                {isRegister ? "Sign in" : "Create one"}
              </button>
            </p>

            <div className="pt-4 border-t border-vellum-high">
              <Link href="/demo" className="block w-full text-center py-2.5 text-[11px] font-semibold uppercase tracking-label text-ink-700 hover:text-terracotta hover:bg-vellum-low rounded transition-all">
                See a live demo
              </Link>
            </div>
          </form>
        </div>
      </div>

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-terracotta/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-sage/10 blur-3xl" />
      </div>
    </div>
  );
}
