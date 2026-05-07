export type HabitType = "binary" | "quantity" | "duration";
export type Frequency = "daily" | "weekdays" | "weekends" | "custom";
export type BadgeCategory = "streak" | "consistency" | "special" | "milestone";
export type InsightType = "pattern" | "prediction" | "correlation" | "motivation";

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  streak_freezes: number;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  habit_type: HabitType;
  target_value: number | null;
  target_unit: string | null;
  frequency: Frequency;
  custom_days: number[] | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  log_date: string;
  completed: boolean;
  value: number | null;
  logged_at: string;
}

export interface Streak {
  id: string;
  habit_id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  freeze_used_dates: string[];
  updated_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  category: BadgeCategory;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
}

export interface AiInsight {
  id: string;
  user_id: string;
  insight_type: InsightType;
  message: string;
  generated_at: string;
  is_read: boolean;
}

export interface HabitWithStreak extends Habit {
  streak: Streak | null;
  todayLog: HabitLog | null;
}

export interface LevelInfo {
  level: number;
  name: string;
  xpRequired: number;
  cumulativeXp: number;
}
