import type { Badge } from "@/types";

export const BADGE_DEFINITIONS: Badge[] = [
  { id: "first_step", name: "First Step", description: "Complete your first habit", icon: "👣", xp_reward: 10, category: "milestone" },
  { id: "three_day", name: "Three-peat", description: "3-day streak on any habit", icon: "🔥", xp_reward: 25, category: "streak" },
  { id: "iron_week", name: "Iron Week", description: "Complete ALL habits for 7 straight days", icon: "🦾", xp_reward: 100, category: "consistency" },
  { id: "two_week", name: "Fortnight Fighter", description: "14-day streak on any habit", icon: "⚔️", xp_reward: 75, category: "streak" },
  { id: "monthly", name: "Monthly Master", description: "30-day streak on any habit", icon: "🏆", xp_reward: 200, category: "streak" },
  { id: "sixty_days", name: "Sixty & Counting", description: "60-day streak on any habit", icon: "💎", xp_reward: 350, category: "streak" },
  { id: "century", name: "Century Club", description: "100-day streak on any habit", icon: "👑", xp_reward: 500, category: "streak" },
  { id: "perfect_week", name: "Perfect Week", description: "100% completion for 7 days", icon: "✨", xp_reward: 150, category: "consistency" },
  { id: "five_habits", name: "Habit Collector", description: "Track 5 habits simultaneously", icon: "🎯", xp_reward: 50, category: "milestone" },
  { id: "early_bird", name: "Early Bird", description: "Log a habit before 7 AM for 7 days", icon: "🌅", xp_reward: 75, category: "special" },
  { id: "comeback", name: "Comeback Kid", description: "Rebuild a broken streak to 14+ days", icon: "💪", xp_reward: 100, category: "special" },
  { id: "level_five", name: "Halfway There", description: "Reach Level 5", icon: "🌟", xp_reward: 0, category: "milestone" },
  { id: "level_ten", name: "Transcendent", description: "Reach Level 10", icon: "🔮", xp_reward: 0, category: "milestone" },
  { id: "thousand_xp", name: "XP Hoarder", description: "Earn 1,000 total XP", icon: "💰", xp_reward: 0, category: "milestone" },
  { id: "hydration_30", name: "Hydration Hero", description: "Hit water goal 30 days in a row", icon: "💧", xp_reward: 150, category: "special" },
];
