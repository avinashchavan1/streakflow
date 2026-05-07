"use client";

import { HeatmapCalendar } from "@/components/analytics/HeatmapCalendar";
import { CompletionChart } from "@/components/analytics/CompletionChart";
import { StreakTimeline } from "@/components/analytics/StreakTimeline";
import { HabitCorrelation } from "@/components/analytics/HabitCorrelation";

export default function AnalyticsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Track your progress over time</p>
      </div>

      <HeatmapCalendar />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CompletionChart />
        <StreakTimeline />
      </div>

      <HabitCorrelation />
    </div>
  );
}
