"use client";

import { useState } from "react";
import { useHabitStore } from "@/lib/store/habitStore";
import { useUiStore } from "@/lib/store/uiStore";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FlameIcon } from "@/components/dashboard/StackedRing";
import type { HabitWithStreak } from "@/types";

interface HabitCardProps {
  habit: HabitWithStreak;
}

export function HabitCard({ habit }: HabitCardProps) {
  const { toggleHabit, logHabitValue } = useHabitStore();
  const { triggerConfetti } = useUiStore();
  const [valueInput, setValueInput] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [toggling, setToggling] = useState(false);

  const isCompleted = habit.todayLog?.completed ?? false;
  const currentStreak = habit.streak?.current_streak ?? 0;
  const currentValue = habit.todayLog?.value ?? 0;
  const target = habit.target_value ?? 0;
  const pct =
    habit.habit_type === "binary"
      ? isCompleted
        ? 1
        : 0
      : Math.min(1, currentValue / Math.max(1, target));

  async function handleToggle() {
    setToggling(true);
    await toggleHabit(habit.id);
    // After await, the store has updated. Just check fresh state — no manual fixup.
    const fresh = useHabitStore.getState().habits;
    if (!isCompleted && fresh.length > 0) {
      const allDone = fresh.every((h) => h.todayLog?.completed === true);
      if (allDone) triggerConfetti();
    }
    setToggling(false);
  }

  async function handleValueSubmit() {
    const val = parseFloat(valueInput);
    if (isNaN(val) || val < 0) return;
    await logHabitValue(habit.id, val);
    setShowInput(false);
    setValueInput("");
  }

  const isBinary = habit.habit_type === "binary";

  return (
    <div
      className={cn(
        "rounded-2xl border p-3.5 transition-colors animate-fade-in"
      )}
      style={{
        background: isCompleted
          ? "rgba(48, 209, 88, 0.06)"
          : "var(--sf-surface)",
        borderColor: isCompleted
          ? "rgba(48, 209, 88, 0.2)"
          : "var(--sf-border)",
      }}
    >
      <div className="flex items-center gap-3.5">
        {/* Icon tile */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
          style={{ background: `${habit.color}1f` }}
        >
          {habit.icon}
        </div>

        {/* Name + meta */}
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center gap-2">
            <span className="truncate text-sm font-semibold">
              {habit.name}
            </span>
            {currentStreak > 0 && (
              <span
                className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold"
                style={{ color: "var(--sf-accent)" }}
              >
                <FlameIcon size={11} />
                {currentStreak}d
              </span>
            )}
          </div>
          <div
            className="flex items-center gap-2 text-xs"
            style={{ color: "var(--sf-text-3)" }}
          >
            {isBinary ? (
              <span>{isCompleted ? "Completed" : "Tap to complete"}</span>
            ) : (
              <>
                <span
                  className="sf-num"
                  style={{
                    color: isCompleted
                      ? "var(--sf-success)"
                      : "var(--sf-text-2)",
                  }}
                >
                  {currentValue}/{target} {habit.target_unit}
                </span>
                {!isCompleted && (
                  <div
                    className="h-[3px] max-w-[120px] flex-1 overflow-hidden rounded-full"
                    style={{ background: "var(--sf-surface-3)" }}
                  >
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{
                        width: `${pct * 100}%`,
                        background: habit.color,
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Action */}
        {isBinary ? (
          <button
            onClick={handleToggle}
            disabled={toggling}
            aria-label={
              isCompleted ? "Mark incomplete" : "Mark complete"
            }
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full p-0 transition-transform active:scale-90"
            style={{
              borderWidth: 1.5,
              borderStyle: "solid",
              borderColor: isCompleted
                ? "var(--sf-success)"
                : "var(--sf-border-strong)",
              background: isCompleted ? "var(--sf-success)" : "transparent",
            }}
          >
            {isCompleted && (
              <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                <path
                  d="M3 7.5l3 3 5-6"
                  stroke="#0c0a08"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        ) : (
          <button
            onClick={() => setShowInput(!showInput)}
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
            style={{
              background: isCompleted ? "transparent" : "var(--sf-surface-3)",
              border: `1px solid ${isCompleted ? "rgba(48,209,88,0.3)" : "var(--sf-border)"}`,
              color: isCompleted ? "var(--sf-success)" : "var(--sf-text)",
            }}
          >
            {isCompleted ? "✓ Done" : "Log"}
          </button>
        )}
      </div>

      {showInput && !isBinary && (
        <div className="mt-3 flex items-center gap-2 animate-fade-in">
          <Input
            type="number"
            placeholder={`Enter ${habit.target_unit ?? "value"}`}
            value={valueInput}
            onChange={(e) => setValueInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleValueSubmit()}
            className="flex-1"
            min={0}
            autoFocus
          />
          <Button size="sm" onClick={handleValueSubmit}>
            Save
          </Button>
        </div>
      )}
    </div>
  );
}
