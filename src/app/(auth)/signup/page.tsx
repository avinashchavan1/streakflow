"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, AuthField } from "@/components/auth/AuthShell";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setSuccess(true);
      setLoading(false);
    }
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  if (success) {
    return (
      <AuthShell>
        <div className="text-center">
          <div className="mb-4 text-4xl">📧</div>
          <h1 className="mb-2 text-2xl font-semibold tracking-tight">
            Check your email
          </h1>
          <p
            className="mb-6 text-sm leading-relaxed"
            style={{ color: "var(--sf-text-3)" }}
          >
            We sent a confirmation link to{" "}
            <strong style={{ color: "var(--sf-text)" }}>{email}</strong>. Click
            it to activate your account.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-lg border px-4 py-2.5 text-sm font-semibold"
            style={{
              background: "var(--sf-surface-2)",
              borderColor: "var(--sf-border)",
            }}
          >
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="mb-1.5 text-2xl font-semibold tracking-tight">
        Start your first streak
      </h1>
      <p className="mb-6 text-sm" style={{ color: "var(--sf-text-3)" }}>
        Free, forever. No card required.
      </p>

      {/* Google */}
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

      <form onSubmit={handleSignup} className="flex flex-col gap-3">
        <AuthField
          label="Display name"
          placeholder="Mira K."
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
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
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
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
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div
        className="mt-5 text-center text-xs"
        style={{ color: "var(--sf-text-3)" }}
      >
        Already have one?{" "}
        <Link href="/login" style={{ color: "var(--sf-text)" }}>
          Sign in
        </Link>
      </div>
    </AuthShell>
  );
}
