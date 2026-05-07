"use client";

import { useEffect } from "react";
import { useGamificationStore } from "@/lib/store/gamificationStore";
import { BadgeCard } from "./BadgeCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { BadgeCategory } from "@/types";

const CATEGORY_ORDER: BadgeCategory[] = ["milestone", "streak", "consistency", "special"];
const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  milestone: "Milestones",
  streak: "Streaks",
  consistency: "Consistency",
  special: "Special",
};

export function BadgeGrid() {
  const { badges, earnedBadges, fetchBadges } = useGamificationStore();

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  if (badges.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    );
  }

  const earnedSet = new Set(earnedBadges.map((eb) => eb.badge_id));
  const earnedMap = new Map(earnedBadges.map((eb) => [eb.badge_id, eb.earned_at]));

  return (
    <div className="space-y-8">
      {CATEGORY_ORDER.map((cat) => {
        const catBadges = badges.filter((b) => b.category === cat);
        if (catBadges.length === 0) return null;

        return (
          <div key={cat}>
            <h3 className="text-lg font-semibold mb-3">
              {CATEGORY_LABELS[cat]}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {catBadges.map((badge) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  earned={earnedSet.has(badge.id)}
                  earnedAt={earnedMap.get(badge.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
