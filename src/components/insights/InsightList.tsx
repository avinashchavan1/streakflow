"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { InsightCard } from "./InsightCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { AiInsight } from "@/types";

export function InsightList() {
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, []);

  async function fetchInsights() {
    const supabase = createClient();
    const { data } = await supabase
      .from("ai_insights")
      .select("*")
      .order("generated_at", { ascending: false })
      .limit(20);

    setInsights(data ?? []);
    setLoading(false);
  }

  async function generateInsights() {
    setGenerating(true);
    try {
      const res = await fetch("/api/insights", { method: "POST" });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to generate insights");
      }
      toast.success("New insights generated!");
      await fetchInsights();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  async function markRead(id: string) {
    const supabase = createClient();
    await supabase.from("ai_insights").update({ is_read: true }).eq("id", id);
    setInsights((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_read: true } : i))
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">AI Insights</h2>
        <Button
          onClick={generateInsights}
          disabled={generating}
          size="sm"
        >
          {generating ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          {generating ? "Generating..." : "New Insights"}
        </Button>
      </div>

      {insights.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No insights yet</h3>
          <p className="text-muted-foreground mb-4">
            Generate your first AI-powered insights based on your habit data.
          </p>
          <Button onClick={generateInsights} disabled={generating}>
            Generate Insights
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onMarkRead={markRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}
