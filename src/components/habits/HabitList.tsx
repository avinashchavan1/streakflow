"use client";

import { useEffect } from "react";
import { useHabitStore } from "@/lib/store/habitStore";
import { HabitCard } from "./HabitCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useUiStore } from "@/lib/store/uiStore";
import { isDayScheduled } from "@/lib/utils/dates";

export function HabitList() {
  const { habits, loading, fetchHabits } = useHabitStore();
  const { openHabitForm } = useUiStore();

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const todayHabits = habits.filter((h) =>
    isDayScheduled(new Date(), h.frequency, h.custom_days)
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (todayHabits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4">🎯</div>
        <h3 className="text-xl font-bold mb-2">No habits for today</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Start building your daily routine by adding your first habit.
        </p>
        <Button onClick={() => openHabitForm()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Habit
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {todayHabits.map((habit) => (
        <HabitCard key={habit.id} habit={habit} />
      ))}
    </div>
  );
}
