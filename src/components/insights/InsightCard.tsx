"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AiInsight } from "@/types";
import { TrendingUp, Brain, Link2, Sparkles } from "lucide-react";

const ICONS = {
  pattern: TrendingUp,
  prediction: Brain,
  correlation: Link2,
  motivation: Sparkles,
};

const COLORS = {
  pattern: "text-primary",
  prediction: "text-warning",
  correlation: "text-success",
  motivation: "text-danger",
};

interface InsightCardProps {
  insight: AiInsight;
  onMarkRead?: (id: string) => void;
}

export function InsightCard({ insight, onMarkRead }: InsightCardProps) {
  const Icon = ICONS[insight.insight_type];

  return (
    <Card
      className={cn(
        "glass-card p-4 transition-all animate-fade-in cursor-pointer",
        !insight.is_read && "ring-1 ring-primary/20"
      )}
      onClick={() => onMarkRead?.(insight.id)}
    >
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5", COLORS[insight.insight_type])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {insight.insight_type}
            </span>
            {!insight.is_read && (
              <span className="h-2 w-2 rounded-full bg-primary" />
            )}
          </div>
          <p className="text-sm leading-relaxed">{insight.message}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {new Date(insight.generated_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </Card>
  );
}
