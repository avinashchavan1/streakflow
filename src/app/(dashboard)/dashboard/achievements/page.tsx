"use client";

import { useEffect, useMemo, useState } from "react";
import { useGamificationStore } from "@/lib/store/gamificationStore";
import { useHabitStore } from "@/lib/store/habitStore";
import { format } from "date-fns";
import type { BadgeCategory } from "@/types";

const TABS: ("All" | BadgeCategory)[] = [
  "All",
  "streak",
  "consistency",
  "special",
  "milestone",
];
const TAB_LABEL: Record<string, string> = {
  All: "All",
  streak: "Streak",
  consistency: "Consistency",
  special: "Special",
  milestone: "Milestone",
};

// Approximate progress per badge based on current state
function badgeProgress(
  id: string,
  state: {
    xp: number;
    level: number;
    topStreak: number;
    activeHabits: number;
  }
): { progress: number; total: number } | null {
  switch (id) {
    case "first_step":
      return null; // boolean
    case "three_day":
      return { progress: Math.min(state.topStreak, 3), total: 3 };
    case "iron_week":
      return { progress: Math.min(state.topStreak, 7), total: 7 };
    case "two_week":
      return { progress: Math.min(state.topStreak, 14), total: 14 };
    case "monthly":
      return { progress: Math.min(state.topStreak, 30), total: 30 };
    case "sixty_days":
      return { progress: Math.min(state.topStreak, 60), total: 60 };
    case "century":
      return { progress: Math.min(state.topStreak, 100), total: 100 };
    case "perfect_week":
      return { progress: 0, total: 7 };
    case "five_habits":
      return { progress: Math.min(state.activeHabits, 5), total: 5 };
    case "early_bird":
      return { progress: 0, total: 7 };
    case "comeback":
      return { progress: 0, total: 14 };
    case "level_five":
      return { progress: Math.min(state.level, 5), total: 5 };
    case "level_ten":
      return { progress: Math.min(state.level, 10), total: 10 };
    case "thousand_xp":
      return { progress: Math.min(state.xp, 1000), total: 1000 };
    case "hydration_30":
      return { progress: Math.min(state.topStreak, 30), total: 30 };
    default:
      return null;
  }
}

export default function AchievementsPage() {
  const { profile, badges, earnedBadges, fetchProfile, fetchBadges } =
    useGamificationStore();
  const { habits, fetchHabits } = useHabitStore();
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");

  useEffect(() => {
    fetchProfile();
    fetchBadges();
    fetchHabits();
  }, [fetchProfile, fetchBadges, fetchHabits]);

  const earnedById = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of earnedBadges) map.set(b.badge_id, b.earned_at);
    return map;
  }, [earnedBadges]);

  const state = useMemo(() => {
    const topStreak = Math.max(
      0,
      ...habits.map((h) => h.streak?.current_streak ?? 0)
    );
    return {
      xp: profile?.xp ?? 0,
      level: profile?.level ?? 1,
      topStreak,
      activeHabits: habits.filter((h) => h.is_active).length,
    };
  }, [profile, habits]);

  const filtered = badges.filter((b) =>
    tab === "All" ? true : b.category === tab
  );
  const earnedCount = earnedBadges.length;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <div className="sf-eyebrow">Earned & locked</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-[32px]">
            Achievements
          </h1>
        </div>
        <div className="text-right">
          <div className="sf-num text-[28px] font-semibold">
            {earnedCount}
            <span
              className="font-medium"
              style={{ color: "var(--sf-text-3)" }}
            >
              {" "}
              / {badges.length}
            </span>
          </div>
          <div
            className="text-[11px]"
            style={{ color: "var(--sf-text-3)" }}
          >
            Badges earned
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="mb-6 flex gap-2 overflow-x-auto border-b"
        style={{ borderColor: "var(--sf-border)" }}
      >
        {TABS.map((c) => (
          <button
            key={c}
            onClick={() => setTab(c)}
            className="px-3.5 py-2.5 text-[13px] font-medium"
            style={{
              color: tab === c ? "var(--sf-text)" : "var(--sf-text-3)",
              borderBottom:
                tab === c
                  ? "2px solid var(--sf-text)"
                  : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {TAB_LABEL[c]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((b) => {
          const earnedAt = earnedById.get(b.id);
          const isEarned = !!earnedAt;
          const prog = isEarned ? null : badgeProgress(b.id, state);
          return (
            <div
              key={b.id}
              className="relative overflow-hidden rounded-2xl border p-5"
              style={{
                background: isEarned
                  ? "var(--sf-surface)"
                  : "var(--sf-bg-tint)",
                borderColor: isEarned
                  ? "var(--sf-border-strong)"
                  : "var(--sf-border)",
                opacity: isEarned ? 1 : 0.7,
              }}
            >
              {isEarned && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute"
                  style={{
                    top: -40,
                    right: -40,
                    width: 120,
                    height: 120,
                    background:
                      "radial-gradient(circle, rgba(255, 179, 64, 0.15), transparent 70%)",
                  }}
                />
              )}
              <div
                className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl border text-[28px]"
                style={{
                  background: isEarned
                    ? "linear-gradient(135deg, rgba(255,94,58,0.18), rgba(255,179,64,0.18))"
                    : "var(--sf-surface-2)",
                  borderColor: isEarned
                    ? "rgba(255,179,64,0.3)"
                    : "var(--sf-border)",
                  filter: isEarned
                    ? "none"
                    : "grayscale(1) brightness(0.6)",
                }}
              >
                {b.icon}
              </div>
              <div className="mb-1 text-sm font-semibold">{b.name}</div>
              <div
                className="mb-3.5 min-h-[32px] text-xs"
                style={{ color: "var(--sf-text-3)" }}
              >
                {b.description}
              </div>
              {isEarned ? (
                <div
                  className="flex items-center gap-1.5 text-[11px] font-semibold"
                  style={{ color: "var(--sf-ring-fuel)" }}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 11 11"
                    fill="none"
                  >
                    <path
                      d="M2.5 5.5L4.5 7.5 8.5 3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Earned {format(new Date(earnedAt!), "MMM d")}
                </div>
              ) : prog ? (
                <div>
                  <div
                    className="mb-1.5 flex justify-between text-[11px]"
                    style={{ color: "var(--sf-text-3)" }}
                  >
                    <span>Progress</span>
                    <span className="sf-num">
                      {prog.progress}/{prog.total}
                    </span>
                  </div>
                  <div
                    className="h-1 overflow-hidden rounded-full"
                    style={{ background: "var(--sf-surface-3)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(prog.progress / prog.total) * 100}%`,
                        background: "var(--sf-text-2)",
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div
                  className="text-[11px]"
                  style={{ color: "var(--sf-text-3)" }}
                >
                  Locked
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
