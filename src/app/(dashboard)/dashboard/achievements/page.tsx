"use client";

import { useEffect } from "react";
import { useGamificationStore } from "@/lib/store/gamificationStore";
import { XPBar } from "@/components/gamification/XPBar";
import { BadgeGrid } from "@/components/gamification/BadgeGrid";

export default function AchievementsPage() {
  const { fetchProfile, fetchBadges } = useGamificationStore();

  useEffect(() => {
    fetchProfile();
    fetchBadges();
  }, [fetchProfile, fetchBadges]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Achievements</h1>
        <p className="text-muted-foreground">Your badges and level progress</p>
      </div>

      <XPBar />
      <BadgeGrid />
    </div>
  );
}
