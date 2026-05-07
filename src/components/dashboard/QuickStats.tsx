"use client";

import { useGamificationStore } from "@/lib/store/gamificationStore";
import { useHabitStore } from "@/lib/store/habitStore";
import { getXpProgress } from "@/lib/utils/xp";
import { Card } from "@/components/ui/card";
import { Zap, Flame, Target } from "lucide-react";

export function QuickStats() {
  const { profile } = useGamificationStore();
  const { habits } = useHabitStore();

  const topStreak = Math.max(0, ...habits.map((h) => h.streak?.current_streak ?? 0));
  const xpInfo = profile ? getXpProgress(profile.xp) : null;

  return (
    <div className="grid grid-cols-3 gap-3">
      <Card className="glass-card p-3 text-center">
        <Zap className="h-5 w-5 mx-auto mb-1 text-primary" />
        <p className="text-xl font-bold font-mono">{profile?.xp ?? 0}</p>
        <p className="text-xs text-muted-foreground">Total XP</p>
      </Card>
      <Card className="glass-card p-3 text-center">
        <Flame className="h-5 w-5 mx-auto mb-1 text-danger" />
        <p className="text-xl font-bold font-mono">{topStreak}</p>
        <p className="text-xs text-muted-foreground">Top Streak</p>
      </Card>
      <Card className="glass-card p-3 text-center">
        <Target className="h-5 w-5 mx-auto mb-1 text-success" />
        <p className="text-xl font-bold font-mono">
          Lv.{xpInfo?.currentLevel.level ?? 1}
        </p>
        <p className="text-xs text-muted-foreground">
          {xpInfo?.currentLevel.name ?? "Starter"}
        </p>
      </Card>
    </div>
  );
}
