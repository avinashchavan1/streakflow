"use client";

import { create } from "zustand";
import type { Profile, UserBadge, Badge } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { getLevelForXp } from "@/lib/utils/xp";

interface GamificationState {
  profile: Profile | null;
  badges: Badge[];
  earnedBadges: UserBadge[];
  loading: boolean;
  lastLevelUp: number | null;
  fetchProfile: () => Promise<void>;
  fetchBadges: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearLevelUp: () => void;
}

let inflightProfile: Promise<void> | null = null;
let lastFetchProfileAt = 0;

export const useGamificationStore = create<GamificationState>((set, get) => ({
  profile: null,
  badges: [],
  earnedBadges: [],
  loading: true,
  lastLevelUp: null,

  fetchProfile: async () => {
    const now = Date.now();
    if (inflightProfile) return inflightProfile;
    if (now - lastFetchProfileAt < 500) return;

    inflightProfile = (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        set({ loading: false });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        const computedLevel = getLevelForXp(profile.xp).level;
        const previousLevel = get().profile?.level ?? profile.level;
        // Only write the level if it actually drifted from the stored value.
        if (computedLevel !== profile.level) {
          await supabase
            .from("profiles")
            .update({ level: computedLevel })
            .eq("id", user.id);
          profile.level = computedLevel;
        }
        if (computedLevel > previousLevel) {
          set({ lastLevelUp: computedLevel });
        }
      }

      set({ profile, loading: false });
      lastFetchProfileAt = Date.now();
    })();

    try {
      await inflightProfile;
    } finally {
      inflightProfile = null;
    }
  },

  fetchBadges: async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: badges }, { data: earnedBadges }] = await Promise.all([
      supabase.from("badges").select("*"),
      supabase.from("user_badges").select("*").eq("user_id", user.id),
    ]);

    set({
      badges: badges ?? [],
      earnedBadges: earnedBadges ?? [],
    });
  },

  refreshProfile: async () => {
    lastFetchProfileAt = 0; // bypass dedupe — caller wants fresh data
    await get().fetchProfile();
  },

  clearLevelUp: () => set({ lastLevelUp: null }),
}));
