import { parseISO } from "date-fns";
import type { Habit, HabitLog, Streak } from "@/types";

export function buildInsightPrompt(
  habits: Habit[],
  logs: HabitLog[],
  streaks: Streak[]
): string {
  const habitSummaries = habits.map((h) => {
    const habitLogs = logs.filter((l) => l.habit_id === h.id);
    const streak = streaks.find((s) => s.habit_id === h.id);
    const completedDays = habitLogs.filter((l) => l.completed).length;
    const totalDays = habitLogs.length;

    const dayDistribution = new Map<number, number>();
    for (const log of habitLogs) {
      if (!log.completed) continue;
      const day = parseISO(log.log_date).getDay();
      dayDistribution.set(day, (dayDistribution.get(day) ?? 0) + 1);
    }

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const distribution = dayNames
      .map((name, i) => `${name}: ${dayDistribution.get(i) ?? 0}`)
      .join(", ");

    return `- ${h.icon} ${h.name} (${h.habit_type}): ${completedDays}/${totalDays} days completed, current streak: ${streak?.current_streak ?? 0}, longest: ${streak?.longest_streak ?? 0}. Day distribution: ${distribution}`;
  });

  return `Analyze this user's habit data from the last 30 days and provide 3-5 actionable insights.

Habits:
${habitSummaries.join("\n")}

Respond with a JSON array of insights, each with "type" (pattern|prediction|correlation|motivation) and "message" fields. Be specific, encouraging, and reference actual data patterns. Keep each message under 200 characters.`;
}
