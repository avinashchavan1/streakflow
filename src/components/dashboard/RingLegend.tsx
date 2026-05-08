"use client";

import { useHabitStore } from "@/lib/store/habitStore";
import { isDayScheduled } from "@/lib/utils/dates";
import type { HabitWithStreak } from "@/types";

function ringValue(h: HabitWithStreak): number {
  if (h.habit_type === "binary") return h.todayLog?.completed ? 1 : 0;
  const v = h.todayLog?.value ?? 0;
  const t = h.target_value ?? 1;
  return Math.min(1, v / t);
}

function valueLabel(h: HabitWithStreak): string {
  if (h.habit_type === "binary") {
    return h.todayLog?.completed ? "1/1" : "0/1";
  }
  return `${h.todayLog?.value ?? 0}/${h.target_value ?? 0}`;
}

export function RingLegend() {
  const { habits } = useHabitStore();

  const todayHabits = habits.filter(
    (h) => h.is_active && isDayScheduled(new Date(), h.frequency, h.custom_days)
  );

  if (todayHabits.length === 0) return null;

  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        background: "var(--sf-surface)",
        borderColor: "var(--sf-border)",
      }}
    >
      <div className="sf-eyebrow mb-3">Rings</div>
      <div className="flex flex-col gap-2.5">
        {todayHabits.map((h) => {
          const v = ringValue(h);
          return (
            <div key={h.id} className="flex items-center gap-2.5">
              <div
                className="h-2 w-2 shrink-0 rounded-full"
                style={{
                  background: h.color,
                  boxShadow: `0 0 8px ${h.color}`,
                }}
              />
              <div className="flex-1 truncate text-[13px] font-medium">
                {h.name}
              </div>
              <div
                className="sf-num text-xs"
                style={{ color: "var(--sf-text-3)" }}
              >
                {valueLabel(h)}
              </div>
              <div
                className="h-1 w-14 overflow-hidden rounded-full"
                style={{ background: "var(--sf-surface-3)" }}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{ width: `${v * 100}%`, background: h.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
