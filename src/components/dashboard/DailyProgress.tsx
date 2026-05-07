"use client";

import { useHabitStore } from "@/lib/store/habitStore";
import { isDayScheduled } from "@/lib/utils/dates";
import { StackedRing, type RingDatum } from "./StackedRing";
import type { HabitWithStreak } from "@/types";

function ringValue(h: HabitWithStreak): number {
  if (h.habit_type === "binary") {
    return h.todayLog?.completed ? 1 : 0;
  }
  const v = h.todayLog?.value ?? 0;
  const t = h.target_value ?? 1;
  return Math.min(1, v / t);
}

function progressMessage(pct: number, completed: number, total: number) {
  if (total === 0) return "Add a habit to get started";
  if (pct === 100) return "Perfect day. Every ring closed.";
  if (pct >= 75) return "Almost there. One more push.";
  if (pct >= 50) return "Halfway there. Keep going.";
  if (pct >= 25) return "Nice start. Stack a few more.";
  return `${total - completed} to go. You've got this.`;
}

export function DailyProgress() {
  const { habits } = useHabitStore();

  const todayHabits = habits.filter((h) =>
    isDayScheduled(new Date(), h.frequency, h.custom_days)
  );

  const ringData: RingDatum[] = todayHabits.map((h) => ({
    key: h.id,
    color: h.color,
    value: ringValue(h),
  }));

  const completed = todayHabits.filter(
    (h) => h.todayLog?.completed ?? false
  ).length;
  const total = todayHabits.length;
  const overallPct =
    ringData.length === 0
      ? 0
      : Math.round(
          (ringData.reduce((s, r) => s + r.value, 0) / ringData.length) * 100
        );

  return (
    <div
      className="flex flex-col items-center gap-4 rounded-2xl border p-6 sm:p-7"
      style={{
        background:
          "radial-gradient(ellipse at top, rgba(255,45,85,0.08), transparent 70%), var(--sf-surface)",
        borderColor: "var(--sf-border)",
      }}
    >
      <StackedRing size={240} stroke={16} gap={3} rings={ringData}>
        <div className="sf-eyebrow">Today</div>
        <div className="sf-num text-[52px] font-semibold leading-none mt-1">
          {overallPct}
          <span className="text-2xl" style={{ color: "var(--sf-text-3)" }}>
            %
          </span>
        </div>
        <div className="text-xs mt-1.5" style={{ color: "var(--sf-text-2)" }}>
          {completed} of {total} closed
        </div>
      </StackedRing>
      <div
        className="text-sm text-center max-w-[260px]"
        style={{ color: "var(--sf-text-2)" }}
      >
        {progressMessage(overallPct, completed, total)}
      </div>
    </div>
  );
}
