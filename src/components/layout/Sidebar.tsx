"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useGamificationStore } from "@/lib/store/gamificationStore";
import { getXpProgress } from "@/lib/utils/xp";

const NAV_ITEMS: { href: string; label: string; icon: NavIconName }[] = [
  { href: "/dashboard", label: "Today", icon: "today" },
  { href: "/dashboard/habits", label: "Habits", icon: "habits" },
  { href: "/dashboard/analytics", label: "Analytics", icon: "chart" },
  { href: "/dashboard/achievements", label: "Achievements", icon: "trophy" },
  { href: "/dashboard/insights", label: "Insights", icon: "spark" },
];

type NavIconName = "today" | "habits" | "chart" | "trophy" | "spark";

function NavIcon({ name, active }: { name: NavIconName; active: boolean }) {
  const stroke = active ? "var(--sf-text)" : "var(--sf-text-3)";
  const props = {
    width: 18,
    height: 18,
    viewBox: "0 0 20 20",
    fill: "none",
    stroke,
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "today":
      return (
        <svg {...props}>
          <circle cx="10" cy="10" r="6.5" />
          <path d="M10 6.5V10l2.5 1.5" />
        </svg>
      );
    case "habits":
      return (
        <svg {...props}>
          <path d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13" />
          <circle cx="6" cy="5.5" r="1.2" fill={stroke} />
          <circle cx="9" cy="10" r="1.2" fill={stroke} />
          <circle cx="6" cy="14.5" r="1.2" fill={stroke} />
        </svg>
      );
    case "chart":
      return (
        <svg {...props}>
          <path d="M3.5 14.5V8M8 14.5V4.5M12.5 14.5v-4M17 14.5V11" />
        </svg>
      );
    case "trophy":
      return (
        <svg {...props}>
          <path d="M5.5 4.5h9v3a4.5 4.5 0 01-9 0v-3zM5.5 5.5H3.5v2a2 2 0 002 2M14.5 5.5h2v2a2 2 0 01-2 2M7.5 16.5h5M10 12.5v4" />
        </svg>
      );
    case "spark":
      return (
        <svg {...props}>
          <path d="M10 3l1.6 4.4L16 9l-4.4 1.6L10 15l-1.6-4.4L4 9l4.4-1.6L10 3z" />
        </svg>
      );
  }
}

export function Sidebar() {
  const pathname = usePathname();
  const { profile, fetchProfile } = useGamificationStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const xpInfo = profile ? getXpProgress(profile.xp) : null;
  const xpPct = xpInfo ? xpInfo.progressPercent : 0;
  const initial = profile?.display_name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <aside
      className="hidden lg:flex w-60 shrink-0 flex-col gap-6 border-r p-4 pt-6"
      style={{
        background: "var(--sf-bg-tint)",
        borderColor: "var(--sf-border)",
      }}
    >
      {/* Logo */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2.5 px-2"
      >
        <div
          className="relative h-7 w-7 rounded-lg"
          style={{
            background:
              "conic-gradient(from 90deg, var(--sf-ring-move), var(--sf-ring-fuel), var(--sf-ring-mind), var(--sf-ring-move))",
          }}
        >
          <div
            className="absolute inset-1.5 rounded"
            style={{ background: "var(--sf-bg-tint)" }}
          />
        </div>
        <div className="text-[15px] font-semibold tracking-tight">
          StreakFlow
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "" : "hover:bg-[var(--sf-surface-2)]"
              )}
              style={{
                color: isActive ? "var(--sf-text)" : "var(--sf-text-2)",
                background: isActive ? "var(--sf-surface-2)" : "transparent",
              }}
            >
              <NavIcon name={item.icon} active={isActive} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* User card */}
      {profile && xpInfo && (
        <div
          className="rounded-2xl border p-3"
          style={{
            background: "var(--sf-surface)",
            borderColor: "var(--sf-border)",
          }}
        >
          <div className="mb-2.5 flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold text-white"
              style={{
                background: "linear-gradient(135deg, #ff5e3a, #ffb340)",
              }}
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold">
                {profile.display_name}
              </div>
              <div
                className="text-[10.5px]"
                style={{ color: "var(--sf-text-3)" }}
              >
                Lv {xpInfo.currentLevel.level} · {xpInfo.currentLevel.name}
              </div>
            </div>
          </div>
          <div
            className="mb-1.5 flex justify-between text-[10.5px]"
            style={{ color: "var(--sf-text-3)" }}
          >
            <span className="sf-num">{profile.xp.toLocaleString()} XP</span>
            <span className="sf-num">
              {xpInfo.nextLevel
                ? (
                    profile.xp +
                    (xpInfo.xpForNextLevel - xpInfo.xpIntoLevel)
                  ).toLocaleString()
                : "MAX"}
            </span>
          </div>
          <div
            className="h-1 overflow-hidden rounded-full"
            style={{ background: "var(--sf-surface-3)" }}
          >
            <div
              className="h-full rounded-full transition-[width] duration-700"
              style={{
                width: `${xpPct}%`,
                background:
                  "linear-gradient(90deg, var(--sf-ring-move), var(--sf-ring-fuel))",
              }}
            />
          </div>
        </div>
      )}
    </aside>
  );
}
