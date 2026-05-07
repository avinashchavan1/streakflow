"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { Badge } from "@/types";

interface BadgeCardProps {
  badge: Badge;
  earned: boolean;
  earnedAt?: string;
}

export function BadgeCard({ badge, earned, earnedAt }: BadgeCardProps) {
  return (
    <Card
      className={cn(
        "glass-card p-4 text-center transition-all",
        earned
          ? "ring-1 ring-primary/30 shadow-[0_0_15px_rgba(108,92,231,0.15)]"
          : "opacity-40 grayscale"
      )}
    >
      <div className="text-3xl mb-2">{badge.icon}</div>
      <h4 className="font-semibold text-sm">{badge.name}</h4>
      <p className="text-xs text-muted-foreground mt-1">
        {badge.description}
      </p>
      {badge.xp_reward > 0 && (
        <p className="text-xs text-primary mt-1 font-mono">
          +{badge.xp_reward} XP
        </p>
      )}
      {earned && earnedAt && (
        <p className="text-xs text-muted-foreground mt-2">
          Earned {new Date(earnedAt).toLocaleDateString()}
        </p>
      )}
    </Card>
  );
}
