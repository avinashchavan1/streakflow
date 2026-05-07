"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, AuthField } from "@/components/auth/AuthShell";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <AuthShell>
      <h1 className="mb-1.5 text-2xl font-semibold tracking-tight">
        Welcome back
      </h1>
      <p className="mb-6 text-sm" style={{ color: "var(--sf-text-3)" }}>
        Sign in to keep your streaks alive.
      </p>

      <button
        type="button"
        onClick={handleGoogle}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-semibold"
        style={{
          background: "var(--sf-surface-2)",
          borderColor: "var(--sf-border)",
          color: "var(--sf-text)",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 18 18">
          <path
            d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.71v2.26h2.92a8.78 8.78 0 002.68-6.61z"
            fill="#4285F4"
          />
          <path
            d="M9 18a8.6 8.6 0 005.96-2.18l-2.91-2.26a5.4 5.4 0 01-8.09-2.85H.96v2.33A9 9 0 009 18z"
            fill="#34A853"
          />
          <path
            d="M3.96 10.71A5.4 5.4 0 013.68 9c0-.6.1-1.18.28-1.71V4.96H.96A9 9 0 000 9c0 1.45.35 2.82.96 4.04l3-2.33z"
            fill="#FBBC05"
          />
          <path
            d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 009 0 9 9 0 00.96 4.96l3 2.33A5.4 5.4 0 019 3.58z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </button>

      <div
        className="mb-4 flex items-center gap-3 text-[11px]"
        style={{ color: "var(--sf-text-3)" }}
      >
        <div className="h-px flex-1" style={{ background: "var(--sf-border)" }} />
        <span>or</span>
        <div className="h-px flex-1" style={{ background: "var(--sf-border)" }} />
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-3">
        <AuthField
          label="Email"
          type="email"
          placeholder="mira@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <AuthField
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
          <p className="text-xs" style={{ color: "var(--sf-danger)" }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="mt-1 rounded-lg px-3 py-3 text-sm font-semibold disabled:opacity-60"
          style={{ background: "var(--sf-text)", color: "var(--sf-bg)" }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div
        className="mt-5 text-center text-xs"
        style={{ color: "var(--sf-text-3)" }}
      >
        New here?{" "}
        <Link href="/signup" style={{ color: "var(--sf-text)" }}>
          Create an account
        </Link>
      </div>
    </AuthShell>
  );
}
