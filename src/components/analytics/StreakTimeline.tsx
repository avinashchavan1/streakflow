"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import type { Habit, Streak } from "@/types";

interface HabitStreak {
  habit: Habit;
  streak: Streak;
}

export function StreakTimeline() {
  const [data, setData] = useState<HabitStreak[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: habits }, { data: streaks }] = await Promise.all([
        supabase.from("habits").select("*").eq("is_active", true),
        supabase.from("streaks").select("*"),
      ]);

      const combined = (habits ?? [])
        .map((h) => ({
          habit: h,
          streak: (streaks ?? []).find((s) => s.habit_id === h.id),
        }))
        .filter((x): x is HabitStreak => !!x.streak)
        .sort((a, b) => b.streak.longest_streak - a.streak.longest_streak);

      setData(combined);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <Card className="glass-card p-4 h-48 animate-pulse" />;
  }

  const maxStreak = Math.max(1, ...data.map((d) => d.streak.longest_streak));

  return (
    <Card className="glass-card p-4">
      <h3 className="font-semibold mb-3">Streak History</h3>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No streaks yet</p>
      ) : (
        <div className="space-y-3">
          {data.map(({ habit, streak }) => (
            <div key={habit.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>
                  {habit.icon} {habit.name}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  Best: {streak.longest_streak}d / Now: {streak.current_streak}d
                </span>
              </div>
              <div className="flex gap-1 h-4">
                <div
                  className="rounded bg-primary/40 transition-all"
                  style={{ width: `${(streak.current_streak / maxStreak) * 100}%` }}
                />
                <div
                  className="rounded bg-primary/15"
                  style={{
                    width: `${((streak.longest_streak - streak.current_streak) / maxStreak) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
