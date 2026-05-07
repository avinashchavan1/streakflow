"use client";

import { useGamificationStore } from "@/lib/store/gamificationStore";
import { getXpProgress } from "@/lib/utils/xp";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function XPBar() {
  const { profile } = useGamificationStore();
  if (!profile) return null;

  const info = getXpProgress(profile.xp);

  return (
    <Card className="glass-card p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-lg font-bold">
            Level {info.currentLevel.level}
          </span>
          <span className="ml-2 text-sm text-muted-foreground">
            {info.currentLevel.name}
          </span>
        </div>
        <span className="font-mono text-sm text-primary">
          {profile.xp} XP
        </span>
      </div>

      <Progress value={info.progressPercent} className="h-3" />

      <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
        <span>{info.xpIntoLevel} / {info.xpForNextLevel} XP</span>
        {info.nextLevel && (
          <span>Next: {info.nextLevel.name}</span>
        )}
      </div>
    </Card>
  );
}
