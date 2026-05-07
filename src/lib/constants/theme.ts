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

// Apple-Fitness-rings identity palette
export const HABIT_COLORS = [
  "#ff2d55", // move — coral red
  "#ffb340", // fuel — amber
  "#00d9b2", // mind — mint
  "#af52de", // flow — violet
  "#5ac8fa", // rest — sky
  "#ff5e3a", // accent — orange
  "#30d158", // success — green
  "#ff453a", // danger — red
  "#bf5af2", // pink-violet
  "#64d2ff", // light blue
] as const;

export const HABIT_TEMPLATES = [
  { name: "Drink Water", icon: "💧", habit_type: "quantity" as const, target_value: 8, target_unit: "glasses", color: "#ffb340" },
  { name: "Exercise", icon: "🏋️", habit_type: "duration" as const, target_value: 30, target_unit: "minutes", color: "#ff2d55" },
  { name: "Read", icon: "📚", habit_type: "duration" as const, target_value: 20, target_unit: "minutes", color: "#af52de" },
  { name: "Meditate", icon: "🧘", habit_type: "duration" as const, target_value: 10, target_unit: "minutes", color: "#00d9b2" },
  { name: "Code", icon: "💻", habit_type: "duration" as const, target_value: 60, target_unit: "minutes", color: "#5ac8fa" },
  { name: "Journal", icon: "✍️", habit_type: "binary" as const, target_value: null, target_unit: null, color: "#ff5e3a" },
] as const;

export const MAX_ACTIVE_HABITS = 10;
