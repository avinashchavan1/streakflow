"use client";

import { useHabitStore } from "@/lib/store/habitStore";
import { isDayScheduled } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";

export function DailyProgress() {
  const { habits } = useHabitStore();

  const todayHabits = habits.filter((h) =>
    isDayScheduled(new Date(), h.frequency, h.custom_days)
  );
  const completed = todayHabits.filter((h) => h.todayLog?.completed).length;
  const total = todayHabits.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-28 w-28 shrink-0">
        <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn(
              "transition-all duration-700",
              percent === 100 ? "text-success" : "text-primary"
            )}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold font-mono">{percent}%</span>
        </div>
      </div>
      <div>
        <p className="text-lg font-semibold">
          {completed}/{total} done
        </p>
        <p className="text-sm text-muted-foreground">
          {percent === 100
            ? "Perfect day! 🎉"
            : percent >= 50
              ? "Keep going! 💪"
              : "Let's get started!"}
        </p>
      </div>
    </div>
  );
}
