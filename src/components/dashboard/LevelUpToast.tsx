"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useGamificationStore } from "@/lib/store/gamificationStore";
import { LEVELS } from "@/lib/utils/xp";

export function LevelUpToast() {
  const { lastLevelUp, clearLevelUp } = useGamificationStore();

  useEffect(() => {
    if (lastLevelUp == null) return;
    const lvl = LEVELS.find((l) => l.level === lastLevelUp);
    toast.success(
      `Lv ${lastLevelUp}${lvl ? ` — ${lvl.name}` : ""}`,
      { description: "Level up." }
    );
    clearLevelUp();
  }, [lastLevelUp, clearLevelUp]);

  return null;
}
