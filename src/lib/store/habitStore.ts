"use client";

import { create } from "zustand";
import type { HabitWithStreak, Habit } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { today } from "@/lib/utils/dates";
import { calculateNewStreak } from "@/lib/utils/streaks";
import { useGamificationStore } from "@/lib/store/gamificationStore";
import { checkBadgeUnlocks } from "@/lib/utils/badges";
import { subDays, format } from "date-fns";

interface HabitState {
  habits: HabitWithStreak[];
  loading: boolean;
  todayDate: string;
  fetchHabits: (force?: boolean) => Promise<void>;
  toggleHabit: (habitId: string) => Promise<void>;
  logHabitValue: (habitId: string, value: number) => Promise<void>;
  addHabit: (habit: Partial<Habit>) => Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  reorderHabits: (habits: HabitWithStreak[]) => Promise<void>;
}

let inflightFetch: Promise<void> | null = null;
let lastFetchAt = 0;
const FETCH_DEDUPE_MS = 1000;

async function awardBadges(habits: HabitWithStreak[]) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const since = format(subDays(new Date(), 90), "yyyy-MM-dd");
  const [{ data: profile }, { data: earned }, { data: logs }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("user_badges").select("badge_id").eq("user_id", user.id),
      supabase.from("habit_logs").select("*").gte("log_date", since),
    ]);
  if (!profile) return;

  const newly = checkBadgeUnlocks({
    profile,
    habits,
    streaks: habits
      .map((h) => h.streak)
      .filter((s): s is NonNullable<typeof s> => !!s),
    logs: logs ?? [],
    earnedBadgeIds: (earned ?? []).map((e) => e.badge_id),
  });
  if (newly.length === 0) return;
  await supabase
    .from("user_badges")
    .insert(newly.map((id) => ({ user_id: user.id, badge_id: id })));
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  loading: true,
  todayDate: today(),

  fetchHabits: async (force = false) => {
    const now = Date.now();
    if (!force && inflightFetch) return inflightFetch;
    if (!force && now - lastFetchAt < FETCH_DEDUPE_MS) return;

    inflightFetch = (async () => {
      const supabase = createClient();
      const todayStr = today();

      // Fetch all habits (active + archived); callers filter at render.
      const { data: habits } = await supabase
        .from("habits")
        .select("*")
        .order("sort_order", { ascending: true });

      if (!habits) {
        set({ loading: false });
        return;
      }

      const habitIds = habits.map((h) => h.id);

      const [{ data: streaks }, { data: logs }] = await Promise.all([
        supabase.from("streaks").select("*").in("habit_id", habitIds),
        supabase
          .from("habit_logs")
          .select("*")
          .in("habit_id", habitIds)
          .eq("log_date", todayStr),
      ]);

      const habitsWithStreaks: HabitWithStreak[] = habits.map((h) => ({
        ...h,
        streak: streaks?.find((s) => s.habit_id === h.id) ?? null,
        todayLog: logs?.find((l) => l.habit_id === h.id) ?? null,
      }));

      set({ habits: habitsWithStreaks, loading: false, todayDate: todayStr });
      lastFetchAt = Date.now();
    })();

    try {
      await inflightFetch;
    } finally {
      inflightFetch = null;
    }
  },

  toggleHabit: async (habitId: string) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const todayStr = today();
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return;

    const wasCompleted = habit.todayLog?.completed ?? false;
    const completing = !wasCompleted;

    const { data: log } = await supabase
      .from("habit_logs")
      .upsert(
        {
          habit_id: habitId,
          user_id: user.id,
          log_date: todayStr,
          completed: completing,
          value: completing ? habit.target_value ?? 1 : null,
        },
        { onConflict: "habit_id,log_date" }
      )
      .select()
      .single();

    const newStreakData = calculateNewStreak(
      habit.streak,
      habit,
      todayStr,
      completing
    );

    const { data: streak } = await supabase
      .from("streaks")
      .upsert(
        {
          habit_id: habitId,
          user_id: user.id,
          ...newStreakData,
        },
        { onConflict: "habit_id" }
      )
      .select()
      .single();

    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === habitId ? { ...h, todayLog: log, streak } : h
      ),
    }));

    // Refresh profile (XP awarded server-side via trigger)
    await useGamificationStore.getState().refreshProfile();
    if (completing) await awardBadges(get().habits);
  },

  logHabitValue: async (habitId: string, value: number) => {
    if (!Number.isFinite(value) || value < 0) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const todayStr = today();
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return;

    const completed = habit.target_value
      ? value >= habit.target_value
      : value > 0;
    const wasCompleted = habit.todayLog?.completed ?? false;

    const { data: log } = await supabase
      .from("habit_logs")
      .upsert(
        {
          habit_id: habitId,
          user_id: user.id,
          log_date: todayStr,
          completed,
          value,
        },
        { onConflict: "habit_id,log_date" }
      )
      .select()
      .single();

    let nextStreak = habit.streak;
    if (completed && !wasCompleted) {
      const newStreakData = calculateNewStreak(
        habit.streak,
        habit,
        todayStr,
        true
      );
      const { data: streak } = await supabase
        .from("streaks")
        .upsert(
          {
            habit_id: habitId,
            user_id: user.id,
            ...newStreakData,
          },
          { onConflict: "habit_id" }
        )
        .select()
        .single();
      nextStreak = streak;
    }

    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === habitId ? { ...h, todayLog: log, streak: nextStreak } : h
      ),
    }));

    if (completed && !wasCompleted) {
      await useGamificationStore.getState().refreshProfile();
      await awardBadges(get().habits);
    }
  },

  addHabit: async (habitData: Partial<Habit>) => {
    if (!habitData.name || !habitData.name.trim()) return;
    if (
      habitData.target_value !== null &&
      habitData.target_value !== undefined &&
      (!Number.isFinite(habitData.target_value) || habitData.target_value < 1)
    ) {
      return;
    }
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const maxOrder = Math.max(0, ...get().habits.map((h) => h.sort_order));

    await supabase.from("habits").insert({
      ...habitData,
      user_id: user.id,
      sort_order: maxOrder + 1,
    });

    await get().fetchHabits(true);
    await awardBadges(get().habits);
  },

  updateHabit: async (id: string, updates: Partial<Habit>) => {
    const supabase = createClient();
    await supabase.from("habits").update(updates).eq("id", id);
    set((state) => ({
      habits: state.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    }));
  },

  deleteHabit: async (id: string) => {
    const supabase = createClient();
    await supabase.from("habits").update({ is_active: false }).eq("id", id);
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === id ? { ...h, is_active: false } : h
      ),
    }));
  },

  reorderHabits: async (reordered: HabitWithStreak[]) => {
    const supabase = createClient();
    const previous = get().habits;
    set({ habits: reordered });

    // Single upsert with all reordered rows
    const updates = reordered.map((h, i) => ({ id: h.id, sort_order: i }));
    const { error } = await supabase.from("habits").upsert(
      updates.map((u) => {
        const original = reordered.find((h) => h.id === u.id)!;
        return {
          id: u.id,
          sort_order: u.sort_order,
          // Required NOT NULL fields for upsert
          user_id: original.user_id,
          name: original.name,
          icon: original.icon,
          color: original.color,
        };
      }),
      { onConflict: "id" }
    );
    if (error) {
      // Roll back optimistic state on failure
      set({ habits: previous });
    }
  },
}));
