"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, subDays, startOfWeek, getDay } from "date-fns";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface DayData {
  date: string;
  completed: number;
  total: number;
}

export function HeatmapCalendar() {
  const [data, setData] = useState<Map<string, DayData>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const startDate = format(subDays(new Date(), 364), "yyyy-MM-dd");

      const [{ data: logs }, { data: habits }] = await Promise.all([
        supabase
          .from("habit_logs")
          .select("habit_id, log_date, completed")
          .gte("log_date", startDate),
        supabase
          .from("habits")
          .select("id, frequency, custom_days, created_at")
          .eq("is_active", true),
      ]);

      const dayMap = new Map<string, DayData>();
      const totalHabits = habits?.length ?? 0;

      for (let i = 0; i <= 364; i++) {
        const d = format(subDays(new Date(), 364 - i), "yyyy-MM-dd");
        dayMap.set(d, { date: d, completed: 0, total: totalHabits });
      }

      for (const log of logs ?? []) {
        if (!log.completed) continue;
        const entry = dayMap.get(log.log_date);
        if (entry) entry.completed++;
      }

      setData(dayMap);
      setLoading(false);
    }
    load();
  }, []);

  function getIntensity(completed: number, total: number): string {
    if (total === 0 || completed === 0) return "bg-muted";
    const pct = completed / total;
    if (pct >= 1) return "bg-success";
    if (pct >= 0.5) return "bg-success/60";
    return "bg-success/30";
  }

  const days = Array.from(data.values());
  const weeks: DayData[][] = [];
  let currentWeek: DayData[] = [];

  if (days.length > 0) {
    const firstDayOfWeek = getDay(new Date(days[0].date));
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ date: "", completed: 0, total: 0 });
    }
  }

  for (const day of days) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  if (loading) {
    return <Card className="glass-card p-4 h-40 animate-pulse" />;
  }

  return (
    <Card className="glass-card p-4">
      <h3 className="font-semibold mb-3">Activity</h3>
      <TooltipProvider>
        <div className="overflow-x-auto">
          <div className="flex gap-[3px] min-w-max">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) => (
                  <Tooltip key={`${wi}-${di}`}>
                    <TooltipTrigger
                      className={cn(
                        "h-3 w-3 rounded-sm transition-colors block",
                        day.date ? getIntensity(day.completed, day.total) : "bg-transparent"
                      )}
                    />
                    {day.date && (
                      <TooltipContent>
                        <p className="text-xs">
                          {format(new Date(day.date), "MMM d, yyyy")}: {day.completed}/{day.total}
                        </p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>
        </div>
      </TooltipProvider>
      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="h-3 w-3 rounded-sm bg-muted" />
          <div className="h-3 w-3 rounded-sm bg-success/30" />
          <div className="h-3 w-3 rounded-sm bg-success/60" />
          <div className="h-3 w-3 rounded-sm bg-success" />
        </div>
        <span>More</span>
      </div>
    </Card>
  );
}
