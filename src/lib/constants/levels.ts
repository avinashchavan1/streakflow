import type { LevelInfo } from "@/types";

export const LEVELS: LevelInfo[] = [
  { level: 1, name: "Starter", xpRequired: 0, cumulativeXp: 0 },
  { level: 2, name: "Beginner", xpRequired: 100, cumulativeXp: 100 },
  { level: 3, name: "Consistent", xpRequired: 300, cumulativeXp: 400 },
  { level: 4, name: "Dedicated", xpRequired: 600, cumulativeXp: 1000 },
  { level: 5, name: "Disciplined", xpRequired: 1000, cumulativeXp: 2000 },
  { level: 6, name: "Machine", xpRequired: 1500, cumulativeXp: 3500 },
  { level: 7, name: "Unstoppable", xpRequired: 2500, cumulativeXp: 6000 },
  { level: 8, name: "Legend", xpRequired: 4000, cumulativeXp: 10000 },
  { level: 9, name: "Mythic", xpRequired: 6000, cumulativeXp: 16000 },
  { level: 10, name: "Transcendent", xpRequired: 10000, cumulativeXp: 26000 },
];

export const MAX_LEVEL = 10;
