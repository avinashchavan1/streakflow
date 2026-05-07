"use client";

import { create } from "zustand";
import type { HabitWithStreak, Habit, HabitLog, Streak } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { today } from "@/lib/utils/dates";
import { calculateNewStreak } from "@/lib/utils/streaks";
import { getCompletionXp, PERFECT_DAY_BONUS } from "@/lib/utils/xp";

interface HabitState {
  habits: HabitWithStreak[];
  loading: boolean;
  todayDate: string;
  fetchHabits: () => Promise<void>;
  toggleHabit: (habitId: string) => Promise<void>;
  logHabitValue: (habitId: string, value: number) => Promise<void>;
  addHabit: (habit: Partial<Habit>) => Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  reorderHabits: (habits: HabitWithStreak[]) => Promise<void>;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  loading: true,
  todayDate: today(),

  fetchHabits: async () => {
    const supabase = createClient();
    const todayStr = today();

    const { data: habits } = await supabase
      .from("habits")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (!habits) { set({ loading: false }); return; }

    const habitIds = habits.map((h) => h.id);

    const [{ data: streaks }, { data: logs }] = await Promise.all([
      supabase.from("streaks").select("*").in("habit_id", habitIds),
      supabase.from("habit_logs").select("*").in("habit_id", habitIds).eq("log_date", todayStr),
    ]);

    const habitsWithStreaks: HabitWithStreak[] = habits.map((h) => ({
      ...h,
      streak: streaks?.find((s) => s.habit_id === h.id) ?? null,
      todayLog: logs?.find((l) => l.habit_id === h.id) ?? null,
    }));

    set({ habits: habitsWithStreaks, loading: false, todayDate: todayStr });
  },

  toggleHabit: async (habitId: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const todayStr = today();
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return;

    const wasCompleted = habit.todayLog?.completed ?? false;
    const completing = !wasCompleted;

    const { data: log } = await supabase
      .from("habit_logs")
      .upsert({
        habit_id: habitId,
        user_id: user.id,
        log_date: todayStr,
        completed: completing,
        value: completing ? (habit.target_value ?? 1) : null,
      }, { onConflict: "habit_id,log_date" })
      .select()
      .single();

    const newStreakData = calculateNewStreak(habit.streak, habit, todayStr, completing);

    const { data: streak } = await supabase
      .from("streaks")
      .upsert({
        habit_id: habitId,
        user_id: user.id,
        ...newStreakData,
      }, { onConflict: "habit_id" })
      .select()
      .single();

    if (completing) {
      const xpGain = getCompletionXp(habit.habit_type, newStreakData.current_streak);
      await supabase.rpc("increment_xp", { uid: user.id, amount: xpGain });

      const allHabits = get().habits;
      const allCompleted = allHabits.every((h) =>
        h.id === habitId ? true : h.todayLog?.completed
      );
      if (allCompleted && allHabits.length > 0) {
        await supabase.rpc("increment_xp", { uid: user.id, amount: PERFECT_DAY_BONUS });
      }
    }

    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === habitId ? { ...h, todayLog: log, streak } : h
      ),
    }));
  },

  logHabitValue: async (habitId: string, value: number) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const todayStr = today();
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return;

    const completed = habit.target_value ? value >= habit.target_value : value > 0;

    const { data: log } = await supabase
      .from("habit_logs")
      .upsert({
        habit_id: habitId,
        user_id: user.id,
        log_date: todayStr,
        completed,
        value,
      }, { onConflict: "habit_id,log_date" })
      .select()
      .single();

    if (completed && !habit.todayLog?.completed) {
      const newStreakData = calculateNewStreak(habit.streak, habit, todayStr, true);
      const { data: streak } = await supabase
        .from("streaks")
        .upsert({
          habit_id: habitId,
          user_id: user.id,
          ...newStreakData,
        }, { onConflict: "habit_id" })
        .select()
        .single();

      const xpGain = getCompletionXp(habit.habit_type, newStreakData.current_streak);
      await supabase.rpc("increment_xp", { uid: user.id, amount: xpGain });

      set((state) => ({
        habits: state.habits.map((h) =>
          h.id === habitId ? { ...h, todayLog: log, streak } : h
        ),
      }));
    } else {
      set((state) => ({
        habits: state.habits.map((h) =>
          h.id === habitId ? { ...h, todayLog: log } : h
        ),
      }));
    }
  },

  addHabit: async (habitData: Partial<Habit>) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const maxOrder = Math.max(0, ...get().habits.map((h) => h.sort_order));

    await supabase.from("habits").insert({
      ...habitData,
      user_id: user.id,
      sort_order: maxOrder + 1,
    });

    await get().fetchHabits();
  },

  updateHabit: async (id: string, updates: Partial<Habit>) => {
    const supabase = createClient();
    await supabase.from("habits").update(updates).eq("id", id);
    await get().fetchHabits();
  },

  deleteHabit: async (id: string) => {
    const supabase = createClient();
    await supabase.from("habits").update({ is_active: false }).eq("id", id);
    set((state) => ({ habits: state.habits.filter((h) => h.id !== id) }));
  },

  reorderHabits: async (reordered: HabitWithStreak[]) => {
    const supabase = createClient();
    set({ habits: reordered });

    const updates = reordered.map((h, i) => ({ id: h.id, sort_order: i }));
    for (const u of updates) {
      await supabase.from("habits").update({ sort_order: u.sort_order }).eq("id", u.id);
    }
  },
}));
