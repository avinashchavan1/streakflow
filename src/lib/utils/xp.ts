import { LEVELS } from "@/lib/constants/levels";
import type { LevelInfo } from "@/types";

export function getLevelForXp(totalXp: number): LevelInfo {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (totalXp >= level.cumulativeXp) {
      current = level;
    } else {
      break;
    }
  }
  return current;
}

export function getXpProgress(totalXp: number): {
  currentLevel: LevelInfo;
  nextLevel: LevelInfo | null;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
} {
  const currentLevel = getLevelForXp(totalXp);
  const nextIdx = LEVELS.findIndex((l) => l.level === currentLevel.level + 1);
  const nextLevel = nextIdx >= 0 ? LEVELS[nextIdx] : null;

  if (!nextLevel) {
    return {
      currentLevel,
      nextLevel: null,
      xpIntoLevel: 0,
      xpForNextLevel: 0,
      progressPercent: 100,
    };
  }

  const xpIntoLevel = totalXp - currentLevel.cumulativeXp;
  const xpForNextLevel = nextLevel.xpRequired;
  const progressPercent = Math.min(
    Math.round((xpIntoLevel / xpForNextLevel) * 100),
    100
  );

  return { currentLevel, nextLevel, xpIntoLevel, xpForNextLevel, progressPercent };
}

export function getCompletionXp(
  habitType: string,
  currentStreak: number
): number {
  const baseXp = habitType === "binary" ? 10 : 15;
  let streakBonus = 0;

  if (currentStreak >= 90) streakBonus = 50;
  else if (currentStreak >= 60) streakBonus = 30;
  else if (currentStreak >= 30) streakBonus = 20;
  else if (currentStreak >= 14) streakBonus = 10;
  else if (currentStreak >= 7) streakBonus = 5;

  return baseXp + streakBonus;
}

export const PERFECT_DAY_BONUS = 25;
