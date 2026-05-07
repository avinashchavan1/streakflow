"use client";

import { useState } from "react";
import { useHabitStore } from "@/lib/store/habitStore";
import { useUiStore } from "@/lib/store/uiStore";
import { getStreakFireLevel } from "@/lib/utils/streaks";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Minus } from "lucide-react";
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
  const fireLevel = getStreakFireLevel(currentStreak);

  async function handleToggle() {
    if (habit.habit_type === "binary") {
      setToggling(true);
      await toggleHabit(habit.id);
      if (!isCompleted) {
        const habits = useHabitStore.getState().habits;
        const allDone = habits.every((h) =>
          h.id === habit.id ? true : h.todayLog?.completed
        );
        if (allDone) triggerConfetti();
      }
      setToggling(false);
    } else {
      setShowInput(!showInput);
    }
  }

  async function handleValueSubmit() {
    const val = parseFloat(valueInput);
    if (isNaN(val) || val < 0) return;
    await logHabitValue(habit.id, val);
    setShowInput(false);
    setValueInput("");
  }

  const currentValue = habit.todayLog?.value ?? 0;

  return (
    <Card
      className={cn(
        "glass-card p-4 transition-all duration-200 animate-fade-in",
        isCompleted && "ring-2 ring-success/30"
      )}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl transition-all duration-200",
            isCompleted
              ? "bg-success/20 scale-110"
              : "bg-muted hover:bg-muted/80"
          )}
          style={{ borderColor: habit.color, borderWidth: isCompleted ? 2 : 0 }}
        >
          {isCompleted ? <Check className="h-6 w-6 text-success" /> : habit.icon}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                "font-medium truncate",
                isCompleted && "text-success"
              )}
            >
              {habit.name}
            </h3>
            {currentStreak > 0 && (
              <span className="text-sm whitespace-nowrap">
                {fireLevel} {currentStreak}d
              </span>
            )}
          </div>
          {habit.habit_type !== "binary" && (
            <p className="text-sm text-muted-foreground">
              {currentValue}/{habit.target_value} {habit.target_unit}
            </p>
          )}
        </div>

        {habit.habit_type !== "binary" && !isCompleted && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowInput(!showInput)}
            className="shrink-0"
          >
            Log
          </Button>
        )}
      </div>

      {showInput && (
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
    </Card>
  );
}
