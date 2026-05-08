"use client";

import { useHabitStore } from "@/lib/store/habitStore";
import { useGamificationStore } from "@/lib/store/gamificationStore";
import { FlameIcon } from "./StackedRing";

export function StreakDisplay() {
  const { habits } = useHabitStore();
  const { profile } = useGamificationStore();

  const streaks = habits
    .filter((h) => h.is_active && (h.streak?.current_streak ?? 0) > 0)
    .sort(
      (a, b) =>
        (b.streak?.current_streak ?? 0) - (a.streak?.current_streak ?? 0)
    )
    .slice(0, 5);

  const freezes = profile?.streak_freezes ?? 0;

  return (
    <div className="space-y-3.5">
      <div>
        <h2 className="sf-eyebrow mb-3">Active Streaks</h2>
        {streaks.length === 0 ? (
          <div
            className="rounded-2xl border p-4 text-sm"
            style={{
              background: "var(--sf-surface)",
              borderColor: "var(--sf-border)",
              color: "var(--sf-text-3)",
            }}
          >
            Complete a habit to start a streak.
          </div>
        ) : (
          <div
            className="rounded-2xl border p-1.5"
            style={{
              background: "var(--sf-surface)",
              borderColor: "var(--sf-border)",
            }}
          >
            {streaks.map((h, i) => (
              <div
                key={h.id}
                className="flex items-center gap-3 px-3 py-2.5"
                style={{
                  borderTop:
                    i === 0 ? "none" : "1px solid var(--sf-divider)",
                }}
              >
                <div
                  className="sf-num w-4 text-[13px]"
                  style={{ color: "var(--sf-text-3)" }}
                >
                  {i + 1}
                </div>
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-sm"
                  style={{ background: `${h.color}1f` }}
                >
                  {h.icon}
                </div>
                <div className="flex-1 truncate text-[13px] font-medium">
                  {h.name}
                </div>
                <div
                  className="inline-flex items-center gap-1 text-[13px] font-semibold"
                  style={{ color: "var(--sf-accent)" }}
                >
                  <FlameIcon size={12} />
                  <span className="sf-num">{h.streak?.current_streak}d</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Streak freezes */}
      <div
        className="rounded-2xl border p-3.5"
        style={{
          background: "rgba(90, 200, 250, 0.06)",
          borderColor: "rgba(90, 200, 250, 0.18)",
        }}
      >
        <div className="mb-1.5 flex items-center gap-2.5">
          <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
            <path
              d="M8 1.5v13M3 4l10 8M3 12L13 4"
              stroke="var(--sf-ring-rest)"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          </svg>
          <div className="text-[13px] font-semibold">Streak Freezes</div>
        </div>
        <div className="text-xs" style={{ color: "var(--sf-text-3)" }}>
          <span
            className="sf-num font-semibold"
            style={{ color: "var(--sf-text)" }}
          >
            {freezes}
          </span>{" "}
          available · resets Sunday
        </div>
      </div>
    </div>
  );
}
