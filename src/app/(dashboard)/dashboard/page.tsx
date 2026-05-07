"use client";

import { formatDisplay } from "@/lib/utils/dates";
import { HabitList } from "@/components/habits/HabitList";
import { HabitForm } from "@/components/habits/HabitForm";
import { DailyProgress } from "@/components/dashboard/DailyProgress";
import { StreakDisplay } from "@/components/dashboard/StreakDisplay";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useUiStore } from "@/lib/store/uiStore";
import { Confetti } from "@/components/dashboard/Confetti";

export default function DashboardPage() {
  const { openHabitForm, showConfetti } = useUiStore();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {showConfetti && <Confetti />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Today</h1>
          <p className="text-muted-foreground">{formatDisplay(new Date())}</p>
        </div>
        <Button onClick={() => openHabitForm()} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Habit
        </Button>
      </div>

      <DailyProgress />
      <QuickStats />
      <HabitList />
      <StreakDisplay />
      <HabitForm />
    </div>
  );
}
