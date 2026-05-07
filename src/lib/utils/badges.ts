import type { Habit, Streak, Profile, HabitLog } from "@/types";

export interface BadgeCheckContext {
  profile: Profile;
  habits: Habit[];
  streaks: Streak[];
  logs: HabitLog[];
  earnedBadgeIds: string[];
}

export function checkBadgeUnlocks(ctx: BadgeCheckContext): string[] {
  const newBadges: string[] = [];
  const earned = new Set(ctx.earnedBadgeIds);

  function award(id: string) {
    if (!earned.has(id)) newBadges.push(id);
  }

  if (ctx.logs.length > 0) {
    award("first_step");
  }

  const maxStreak = Math.max(0, ...ctx.streaks.map((s) => s.current_streak));
  if (maxStreak >= 3) award("three_day");
  if (maxStreak >= 14) award("two_week");
  if (maxStreak >= 30) award("monthly");
  if (maxStreak >= 60) award("sixty_days");
  if (maxStreak >= 100) award("century");

  const activeHabits = ctx.habits.filter((h) => h.is_active);
  if (activeHabits.length >= 5) award("five_habits");

  if (ctx.profile.level >= 5) award("level_five");
  if (ctx.profile.level >= 10) award("level_ten");
  if (ctx.profile.xp >= 1000) award("thousand_xp");

  if (checkPerfectWeek(ctx)) award("perfect_week");
  if (checkIronWeek(ctx)) award("iron_week");

  return newBadges;
}

function checkPerfectWeek(ctx: BadgeCheckContext): boolean {
  return checkConsecutivePerfectDays(ctx, 7);
}

function checkIronWeek(ctx: BadgeCheckContext): boolean {
  return checkConsecutivePerfectDays(ctx, 7);
}

function checkConsecutivePerfectDays(ctx: BadgeCheckContext, days: number): boolean {
  const activeHabits = ctx.habits.filter((h) => h.is_active);
  if (activeHabits.length === 0) return false;

  const logsByDate = new Map<string, Set<string>>();
  for (const log of ctx.logs) {
    if (!log.completed) continue;
    const existing = logsByDate.get(log.log_date) ?? new Set();
    existing.add(log.habit_id);
    logsByDate.set(log.log_date, existing);
  }

  const today = new Date();
  let consecutivePerfect = 0;

  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const completedIds = logsByDate.get(dateStr);
    const allDone = activeHabits.every((h) => completedIds?.has(h.id));

    if (allDone) {
      consecutivePerfect++;
      if (consecutivePerfect >= days) return true;
    } else {
      consecutivePerfect = 0;
    }
  }

  return false;
}
