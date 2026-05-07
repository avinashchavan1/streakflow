import { parseISO, subDays } from "date-fns";
import { formatDate, isDayScheduled } from "./dates";
import type { Habit, Streak } from "@/types";

export function calculateNewStreak(
  streak: Streak | null,
  habit: Habit,
  completionDate: string,
  completing: boolean
): { current_streak: number; longest_streak: number; last_completed_date: string | null } {
  if (!completing) {
    const currentStreak = streak?.current_streak ?? 0;
    return {
      current_streak: Math.max(0, currentStreak - (streak?.last_completed_date === completionDate ? 1 : 0)),
      longest_streak: streak?.longest_streak ?? 0,
      last_completed_date: streak?.last_completed_date === completionDate
        ? findPreviousScheduledDate(habit, completionDate)
        : streak?.last_completed_date ?? null,
    };
  }

  if (!streak || !streak.last_completed_date) {
    return { current_streak: 1, longest_streak: 1, last_completed_date: completionDate };
  }

  const lastDate = streak.last_completed_date;
  if (lastDate === completionDate) {
    return {
      current_streak: streak.current_streak,
      longest_streak: streak.longest_streak,
      last_completed_date: completionDate,
    };
  }

  const isConsecutive = isConsecutiveScheduledDay(habit, lastDate, completionDate);

  if (isConsecutive) {
    const newStreak = streak.current_streak + 1;
    return {
      current_streak: newStreak,
      longest_streak: Math.max(newStreak, streak.longest_streak),
      last_completed_date: completionDate,
    };
  }

  return {
    current_streak: 1,
    longest_streak: streak.longest_streak,
    last_completed_date: completionDate,
  };
}

function isConsecutiveScheduledDay(
  habit: Habit,
  lastDateStr: string,
  currentDateStr: string
): boolean {
  const lastDate = parseISO(lastDateStr);
  const currentDate = parseISO(currentDateStr);

  let checkDate = subDays(currentDate, 1);
  while (checkDate > lastDate) {
    if (isDayScheduled(checkDate, habit.frequency, habit.custom_days)) {
      return false;
    }
    checkDate = subDays(checkDate, 1);
  }

  return formatDate(checkDate) === lastDateStr || formatDate(lastDate) === lastDateStr;
}

function findPreviousScheduledDate(
  habit: Habit,
  fromDateStr: string
): string | null {
  const fromDate = parseISO(fromDateStr);
  for (let i = 1; i <= 7; i++) {
    const d = subDays(fromDate, i);
    if (isDayScheduled(d, habit.frequency, habit.custom_days)) {
      return formatDate(d);
    }
  }
  return null;
}

export function getStreakFireLevel(streak: number): string {
  if (streak >= 100) return "🔥🔥🔥🔥🔥";
  if (streak >= 60) return "🔥🔥🔥🔥";
  if (streak >= 30) return "🔥🔥🔥";
  if (streak >= 14) return "🔥🔥";
  if (streak >= 3) return "🔥";
  return "";
}

export function shouldAutoFreeze(
  streak: Streak,
  freezesAvailable: number
): boolean {
  return streak.current_streak > 0 && freezesAvailable > 0;
}

export function earnedFreezes(currentStreak: number): number {
  return Math.min(Math.floor(currentStreak / 7), 3);
}
