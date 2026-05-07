"use client";

import { create } from "zustand";
import type { Profile, UserBadge, Badge } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { getXpProgress } from "@/lib/utils/xp";
import { getLevelForXp } from "@/lib/utils/xp";

interface GamificationState {
  profile: Profile | null;
  badges: Badge[];
  earnedBadges: UserBadge[];
  loading: boolean;
  fetchProfile: () => Promise<void>;
  fetchBadges: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  profile: null,
  badges: [],
  earnedBadges: [],
  loading: true,

  fetchProfile: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profile) {
      const levelInfo = getLevelForXp(profile.xp);
      if (levelInfo.level !== profile.level) {
        await supabase
          .from("profiles")
          .update({ level: levelInfo.level })
          .eq("id", user.id);
        profile.level = levelInfo.level;
      }
    }

    set({ profile, loading: false });
  },

  fetchBadges: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
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
    await get().fetchProfile();
  },
}));
