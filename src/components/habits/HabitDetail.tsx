"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getStreakFireLevel } from "@/lib/utils/streaks";
import { format, subDays } from "date-fns";
import type { Habit, HabitLog, Streak } from "@/types";

interface HabitDetailProps {
  habitId: string;
}

export function HabitDetail({ habitId }: HabitDetailProps) {
  const [habit, setHabit] = useState<Habit | null>(null);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");

      const [{ data: h }, { data: l }, { data: s }] = await Promise.all([
        supabase.from("habits").select("*").eq("id", habitId).single(),
        supabase
          .from("habit_logs")
          .select("*")
          .eq("habit_id", habitId)
          .gte("log_date", thirtyDaysAgo)
          .order("log_date", { ascending: false }),
        supabase.from("streaks").select("*").eq("habit_id", habitId).single(),
      ]);

      setHabit(h);
      setLogs(l ?? []);
      setStreak(s);
      setLoading(false);
    }
    load();
  }, [habitId]);

  if (loading) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  if (!habit) {
    return <p className="text-muted-foreground">Habit not found.</p>;
  }

  const completedDays = logs.filter((l) => l.completed).length;
  const completionRate = logs.length > 0 ? Math.round((completedDays / logs.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
          style={{ backgroundColor: `${habit.color}20` }}
        >
          {habit.icon}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{habit.name}</h1>
          <p className="text-muted-foreground capitalize">
            {habit.habit_type} • {habit.frequency}
            {habit.target_value && ` • Target: ${habit.target_value} ${habit.target_unit}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="glass-card p-4 text-center">
          <p className="text-2xl font-bold font-mono">
            {streak?.current_streak ?? 0}
          </p>
          <p className="text-sm text-muted-foreground">Current Streak</p>
          <p className="text-lg">{getStreakFireLevel(streak?.current_streak ?? 0)}</p>
        </Card>
        <Card className="glass-card p-4 text-center">
          <p className="text-2xl font-bold font-mono">
            {streak?.longest_streak ?? 0}
          </p>
          <p className="text-sm text-muted-foreground">Best Streak</p>
        </Card>
        <Card className="glass-card p-4 text-center">
          <p className="text-2xl font-bold font-mono">{completedDays}</p>
          <p className="text-sm text-muted-foreground">Days (30d)</p>
        </Card>
        <Card className="glass-card p-4 text-center">
          <p className="text-2xl font-bold font-mono">{completionRate}%</p>
          <p className="text-sm text-muted-foreground">Rate (30d)</p>
        </Card>
      </div>

      <Card className="glass-card p-4">
        <h3 className="font-semibold mb-3">Recent Log</h3>
        <div className="space-y-2">
          {logs.slice(0, 14).map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
            >
              <span className="text-sm">
                {format(new Date(log.log_date), "EEE, MMM d")}
              </span>
              <span className={log.completed ? "text-success" : "text-danger"}>
                {log.completed
                  ? log.value
                    ? `${log.value} ${habit.target_unit ?? ""}`
                    : "✓"
                  : "✗"}
              </span>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No logs yet
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
