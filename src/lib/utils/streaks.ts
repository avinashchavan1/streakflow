import { parseISO, subDays } from "date-fns";
import { formatDate, isDayScheduled } from "./dates";
import type { Habit, Streak } from "@/types";

export function calculateNewStreak(
  streak: Streak | null,
  habit: Habit,
  completionDate: string,
  completing: boolean
): {
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
} {
  // Uncompleting today: if today was the streak's last_completed_date,
  // walk back to the previous scheduled day that has a confirmed completion.
  // Without scanning logs we can only safely roll back by one and clear if 0.
  if (!completing) {
    const wasToday = streak?.last_completed_date === completionDate;
    const currentStreak = streak?.current_streak ?? 0;
    const newStreak = wasToday
      ? Math.max(0, currentStreak - 1)
      : currentStreak;
    return {
      current_streak: newStreak,
      longest_streak: streak?.longest_streak ?? 0,
      last_completed_date:
        wasToday && newStreak === 0
          ? null
          : wasToday
            ? findPreviousScheduledDate(habit, completionDate)
            : streak?.last_completed_date ?? null,
    };
  }

  if (!streak || !streak.last_completed_date) {
    return {
      current_streak: 1,
      longest_streak: Math.max(1, streak?.longest_streak ?? 0),
      last_completed_date: completionDate,
    };
  }

  const lastDate = streak.last_completed_date;
  if (lastDate === completionDate) {
    return {
      current_streak: streak.current_streak,
      longest_streak: streak.longest_streak,
      last_completed_date: completionDate,
    };
  }

  const isConsecutive = isConsecutiveScheduledDay(
    habit,
    lastDate,
    completionDate
  );

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

// True iff the only scheduled day strictly between lastDateStr and currentDateStr
// is none — i.e. the user did not skip a scheduled day.
function isConsecutiveScheduledDay(
  habit: Habit,
  lastDateStr: string,
  currentDateStr: string
): boolean {
  const lastDate = parseISO(lastDateStr);
  const currentDate = parseISO(currentDateStr);

  if (currentDate <= lastDate) return false;

  let checkDate = subDays(currentDate, 1);
  while (checkDate > lastDate) {
    if (isDayScheduled(checkDate, habit.frequency, habit.custom_days)) {
      return false;
    }
    checkDate = subDays(checkDate, 1);
  }
  return true;
}

function findPreviousScheduledDate(
  habit: Habit,
  fromDateStr: string
): string | null {
  const fromDate = parseISO(fromDateStr);
  // Look back up to 60 days for the previous scheduled date.
  for (let i = 1; i <= 60; i++) {
    const d = subDays(fromDate, i);
    if (isDayScheduled(d, habit.frequency, habit.custom_days)) {
      return formatDate(d);
    }
  }
  return null;
}
