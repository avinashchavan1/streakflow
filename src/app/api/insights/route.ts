import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildInsightPrompt } from "@/lib/utils/insights";
import Anthropic from "@anthropic-ai/sdk";
import { format, subDays } from "date-fns";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentInsight } = await supabase
      .from("ai_insights")
      .select("id")
      .eq("user_id", user.id)
      .gte("generated_at", oneDayAgo)
      .limit(1);

    if (recentInsight && recentInsight.length > 0) {
      return NextResponse.json(
        { error: "Rate limited — one generation per day" },
        { status: 429 }
      );
    }

    const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");

    const [{ data: habits }, { data: logs }, { data: streaks }] = await Promise.all([
      supabase.from("habits").select("*").eq("user_id", user.id).eq("is_active", true),
      supabase.from("habit_logs").select("*").eq("user_id", user.id).gte("log_date", thirtyDaysAgo),
      supabase.from("streaks").select("*").eq("user_id", user.id),
    ]);

    if (!habits || habits.length === 0) {
      return NextResponse.json(
        { error: "Add some habits first" },
        { status: 400 }
      );
    }

    const prompt = buildInsightPrompt(habits, logs ?? [], streaks ?? []);

    const anthropic = new Anthropic();
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 500 });
    }

    const insights = JSON.parse(jsonMatch[0]) as Array<{
      type: string;
      message: string;
    }>;

    const insightRows = insights.map((i) => ({
      user_id: user.id,
      insight_type: i.type,
      message: i.message,
    }));

    await supabase.from("ai_insights").insert(insightRows);

    return NextResponse.json({ success: true, count: insights.length });
  } catch (err) {
    console.error("Insight generation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
