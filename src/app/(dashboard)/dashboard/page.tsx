"use client";

import { useEffect } from "react";
import { useGamificationStore } from "@/lib/store/gamificationStore";
import { useHabitStore } from "@/lib/store/habitStore";
import { isDayScheduled } from "@/lib/utils/dates";
import { HabitList } from "@/components/habits/HabitList";
import { HabitForm } from "@/components/habits/HabitForm";
import { DailyProgress } from "@/components/dashboard/DailyProgress";
import { StreakDisplay } from "@/components/dashboard/StreakDisplay";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { RingLegend } from "@/components/dashboard/RingLegend";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useUiStore } from "@/lib/store/uiStore";
import { Confetti } from "@/components/dashboard/Confetti";

const WEEKDAY_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTH_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { openHabitForm, showConfetti } = useUiStore();
  const { profile, fetchProfile } = useGamificationStore();
  const { habits } = useHabitStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const todayHabits = habits.filter(
    (h) => h.is_active && isDayScheduled(new Date(), h.frequency, h.custom_days)
  );
  const completed = todayHabits.filter((h) => h.todayLog?.completed).length;
  const total = todayHabits.length;

  const now = new Date();
  const dateLine = `${WEEKDAY_LONG[now.getDay()]}, ${MONTH_LONG[now.getMonth()]} ${now.getDate()}`;
  const firstName = profile?.display_name?.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto max-w-6xl">
      {showConfetti && <Confetti />}

      {/* Header strip */}
      <div className="mb-6 flex items-end justify-between gap-4 lg:mb-8">
        <div>
          <div className="sf-eyebrow">{dateLine}</div>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-[34px]">
            {greeting()}, {firstName}.
          </h1>
        </div>
        <Button
          onClick={() => openHabitForm()}
          className="shrink-0"
          style={{ background: "var(--sf-text)", color: "var(--sf-bg)" }}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add Habit
        </Button>
      </div>

      {/* Hero: rings + stats/legend */}
      <section className="mb-6 grid gap-4 lg:mb-7 lg:grid-cols-[320px_1fr] lg:gap-5">
        <DailyProgress />
        <div className="flex flex-col gap-3.5">
          <QuickStats />
          <RingLegend />
        </div>
      </section>

      {/* Today's habits + active streaks */}
      <section className="grid gap-5 lg:grid-cols-[1fr_320px] lg:gap-6">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="sf-eyebrow">Today&apos;s Habits</h2>
            <span
              className="text-xs"
              style={{ color: "var(--sf-text-3)" }}
            >
              {completed}/{total} done
            </span>
          </div>
          <HabitList />
        </div>

        <div className="lg:pt-0 pt-4">
          <StreakDisplay />
        </div>
      </section>

      <HabitForm />
    </div>
  );
}
