"use client";

import { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-8"
      style={{
        background:
          "radial-gradient(circle at 30% 20%, rgba(255,45,85,0.15), transparent 50%), radial-gradient(circle at 70% 80%, rgba(255,179,64,0.12), transparent 50%), var(--sf-bg)",
      }}
    >
      <div
        className="w-full max-w-[420px] rounded-3xl border p-8 sm:p-9"
        style={{
          background: "rgba(28,24,20,0.7)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderColor: "rgba(255,240,220,0.12)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Logo */}
        <div className="mb-7 flex items-center gap-2.5">
          <div
            className="relative h-8 w-8 rounded-[9px]"
            style={{
              background:
                "conic-gradient(from 90deg, var(--sf-ring-move), var(--sf-ring-fuel), var(--sf-ring-mind), var(--sf-ring-move))",
            }}
          >
            <div
              className="absolute inset-[7px] rounded"
              style={{ background: "var(--sf-bg)" }}
            />
          </div>
          <div className="text-base font-semibold tracking-tight">
            StreakFlow
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AuthField({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="sf-eyebrow">{label}</span>
      <input
        {...props}
        className="rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[var(--sf-border-strong)]"
        style={{
          background: "rgba(20,17,14,0.6)",
          borderColor: "var(--sf-border)",
          color: "var(--sf-text)",
        }}
      />
    </label>
  );
}
