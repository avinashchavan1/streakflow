"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, subDays } from "date-fns";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Habit } from "@/types";

interface CorrelationPair {
  habitA: Habit;
  habitB: Habit;
  correlation: number;
}

export function HabitCorrelation() {
  const [pairs, setPairs] = useState<CorrelationPair[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const startDate = format(subDays(new Date(), 60), "yyyy-MM-dd");

      const [{ data: habits }, { data: logs }] = await Promise.all([
        supabase.from("habits").select("*").eq("is_active", true),
        supabase
          .from("habit_logs")
          .select("habit_id, log_date, completed")
          .gte("log_date", startDate),
      ]);

      if (!habits || habits.length < 2 || !logs) {
        setPairs([]);
        setLoading(false);
        return;
      }

      const completionByHabitDate = new Map<string, Set<string>>();
      for (const log of logs) {
        if (!log.completed) continue;
        const key = log.habit_id;
        if (!completionByHabitDate.has(key)) completionByHabitDate.set(key, new Set());
        completionByHabitDate.get(key)!.add(log.log_date);
      }

      const results: CorrelationPair[] = [];
      for (let i = 0; i < habits.length; i++) {
        for (let j = i + 1; j < habits.length; j++) {
          const daysA = completionByHabitDate.get(habits[i].id) ?? new Set();
          const daysB = completionByHabitDate.get(habits[j].id) ?? new Set();
          const overlap = [...daysA].filter((d) => daysB.has(d)).length;
          const union = new Set([...daysA, ...daysB]).size;
          if (union === 0) continue;
          results.push({
            habitA: habits[i],
            habitB: habits[j],
            correlation: Math.round((overlap / union) * 100),
          });
        }
      }

      results.sort((a, b) => b.correlation - a.correlation);
      setPairs(results.slice(0, 5));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <Card className="glass-card p-4 h-48 animate-pulse" />;
  }

  return (
    <Card className="glass-card p-4">
      <h3 className="font-semibold mb-3">Habit Pairs</h3>
      {pairs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Need at least 2 habits with logs</p>
      ) : (
        <div className="space-y-2">
          {pairs.map((p, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span>
                {p.habitA.icon} {p.habitA.name} + {p.habitB.icon} {p.habitB.name}
              </span>
              <span
                className={cn(
                  "font-mono font-bold",
                  p.correlation >= 70 ? "text-success" : p.correlation >= 40 ? "text-warning" : "text-muted-foreground"
                )}
              >
                {p.correlation}%
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
