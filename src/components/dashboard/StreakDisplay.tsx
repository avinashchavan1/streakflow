"use client";

import { useHabitStore } from "@/lib/store/habitStore";
import { getStreakFireLevel } from "@/lib/utils/streaks";
import { Card } from "@/components/ui/card";

export function StreakDisplay() {
  const { habits } = useHabitStore();

  const streaks = habits
    .filter((h) => h.streak && h.streak.current_streak > 0)
    .sort((a, b) => (b.streak?.current_streak ?? 0) - (a.streak?.current_streak ?? 0))
    .slice(0, 5);

  if (streaks.length === 0) {
    return (
      <Card className="glass-card p-4">
        <h3 className="font-semibold mb-2">Active Streaks</h3>
        <p className="text-sm text-muted-foreground">
          Complete a habit to start a streak!
        </p>
      </Card>
    );
  }

  return (
    <Card className="glass-card p-4">
      <h3 className="font-semibold mb-3">Active Streaks</h3>
      <div className="space-y-2.5">
        {streaks.map((h) => (
          <div key={h.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{h.icon}</span>
              <span className="text-sm font-medium truncate max-w-[120px]">
                {h.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm">
                {getStreakFireLevel(h.streak?.current_streak ?? 0)}
              </span>
              <span className="font-mono font-bold text-sm">
                {h.streak?.current_streak}d
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
