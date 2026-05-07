"use client";

import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  level: number;
  name: string;
  size?: "sm" | "md" | "lg";
}

export function LevelBadge({ level, name, size = "md" }: LevelBadgeProps) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-lg",
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-primary/20 font-bold text-primary border-2 border-primary/30",
          sizeClasses[size]
        )}
      >
        {level}
      </div>
      <span className="text-xs text-muted-foreground">{name}</span>
    </div>
  );
}
