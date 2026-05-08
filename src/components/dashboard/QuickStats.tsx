"use client";

import { useGamificationStore } from "@/lib/store/gamificationStore";
import { useHabitStore } from "@/lib/store/habitStore";
import { getXpProgress } from "@/lib/utils/xp";
import { FlameIcon } from "./StackedRing";

interface TileProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  color?: string;
}

function StatTile({ label, value, sub, color = "var(--sf-text)" }: TileProps) {
  return (
    <div
      className="flex flex-col gap-1.5 rounded-2xl border p-4 sm:p-5"
      style={{
        background: "var(--sf-surface)",
        borderColor: "var(--sf-border)",
      }}
    >
      <div className="sf-eyebrow">{label}</div>
      <div
        className="sf-num text-3xl font-semibold leading-none"
        style={{ color }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-xs" style={{ color: "var(--sf-text-3)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export function QuickStats() {
  const { profile } = useGamificationStore();
  const { habits } = useHabitStore();

  const topStreakHabit = habits
    .filter((h) => h.is_active && h.streak)
    .sort(
      (a, b) =>
        (b.streak?.current_streak ?? 0) - (a.streak?.current_streak ?? 0)
    )[0];
  const topStreak = topStreakHabit?.streak?.current_streak ?? 0;
  const xpInfo = profile ? getXpProgress(profile.xp) : null;
  const xpToNext =
    xpInfo && xpInfo.nextLevel
      ? Math.max(0, xpInfo.xpForNextLevel - xpInfo.xpIntoLevel)
      : 0;
  const isMaxLevel = xpInfo && !xpInfo.nextLevel;

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-3.5">
      <StatTile
        label="Total XP"
        value={profile?.xp.toLocaleString() ?? "0"}
        sub={`Lv ${xpInfo?.currentLevel.level ?? 1} · ${xpInfo?.currentLevel.name ?? "Starter"}`}
      />
      <StatTile
        label="Top Streak"
        value={`${topStreak}d`}
        sub={
          topStreakHabit ? (
            <span className="inline-flex items-center gap-1">
              <FlameIcon size={11} /> {topStreakHabit.name}
            </span>
          ) : (
            "Start one today"
          )
        }
        color="var(--sf-accent)"
      />
      <StatTile
        label={isMaxLevel ? "Max Level" : "To Next Level"}
        value={isMaxLevel ? "★" : xpToNext.toLocaleString()}
        sub={
          isMaxLevel
            ? "Transcendent"
            : `XP to Lv ${(xpInfo?.currentLevel.level ?? 1) + 1}`
        }
        color="var(--sf-ring-fuel)"
      />
    </div>
  );
}
