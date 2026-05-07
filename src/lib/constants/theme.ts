export const COLORS = {
  background: "#0F0F14",
  card: "#1A1A24",
  primary: "#6C5CE7",
  success: "#00B894",
  warning: "#FDCB6E",
  danger: "#E17055",
  textPrimary: "#FFFFFF",
  textSecondary: "#A0A0B8",
  border: "#2D2D3F",
} as const;

export const HABIT_COLORS = [
  "#6C5CE7",
  "#00B894",
  "#E17055",
  "#FDCB6E",
  "#0984E3",
  "#D63031",
  "#00CEC9",
  "#E84393",
  "#FD79A8",
  "#55EFC4",
] as const;

export const HABIT_TEMPLATES = [
  { name: "Drink Water", icon: "💧", habit_type: "quantity" as const, target_value: 8, target_unit: "glasses", color: "#0984E3" },
  { name: "Exercise", icon: "🏋️", habit_type: "duration" as const, target_value: 30, target_unit: "minutes", color: "#E17055" },
  { name: "Read", icon: "📚", habit_type: "duration" as const, target_value: 20, target_unit: "minutes", color: "#6C5CE7" },
  { name: "Meditate", icon: "🧘", habit_type: "duration" as const, target_value: 10, target_unit: "minutes", color: "#00B894" },
  { name: "Code", icon: "💻", habit_type: "duration" as const, target_value: 60, target_unit: "minutes", color: "#D63031" },
  { name: "Journal", icon: "✍️", habit_type: "binary" as const, target_value: null, target_unit: null, color: "#FDCB6E" },
] as const;

export const MAX_ACTIVE_HABITS = 10;
