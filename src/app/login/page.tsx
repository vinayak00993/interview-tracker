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

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-warm-900">
            Interview Tracker
          </h1>
          <p className="text-sm text-warm-600 mt-2 animate-fade-in-up-delay-1">
            {isRegister ? "Create your account" : "Sign in to manage your pipeline"}
          </p>
        </div>

        <div className="space-y-4 bg-white/50 backdrop-blur-sm border border-warm-300/40 rounded-2xl p-6 shadow-elevated">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-warm-700 mb-1.5">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-warm-300 rounded-lg text-warm-900 text-sm focus:outline-none focus:border-terra transition-colors"
                placeholder="Your name"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-warm-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-warm-300 rounded-lg text-warm-900 text-sm focus:outline-none focus:border-terra transition-colors"
              placeholder="you@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-warm-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-warm-300 rounded-lg text-warm-900 text-sm focus:outline-none focus:border-terra transition-colors"
              placeholder="••••••••"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-warm-700 mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-warm-300 rounded-lg text-warm-900 text-sm focus:outline-none focus:border-terra transition-colors"
                placeholder="••••••••"
              />
            </div>
          )}

          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}

          <button
            onClick={isRegister ? handleRegister : handleSignIn}
            disabled={loading}
            className="w-full py-2.5 bg-terra hover:bg-terra-light disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {loading
              ? (isRegister ? "Creating account..." : "Signing in...")
              : (isRegister ? "Create account" : "Sign in")}
          </button>

          <p className="text-center text-xs text-warm-600">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={toggleMode}
              className="text-terra hover:text-terra-light font-medium transition-colors"
            >
              {isRegister ? "Sign in" : "Create account"}
            </button>
          </p>

          <div className="pt-2 border-t border-warm-300/40">
            <Link
              href="/demo"
              className="block w-full text-center py-2 text-xs font-medium text-warm-600 hover:text-warm-900 border border-warm-300/60 hover:border-warm-400 rounded-lg hover:shadow-card transition-all duration-200"
            >
              See a live demo
            </Link>
          </div>
        </div>
      </div>

      {/* Decorative background circles */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-terra/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-warm-400/10 blur-3xl" />
      </div>
    </div>
  );
}
