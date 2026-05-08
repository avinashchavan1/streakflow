import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildInsightPrompt } from "@/lib/utils/insights";
import { getServerEnv } from "@/lib/env";
import Anthropic from "@anthropic-ai/sdk";
import { format, subDays } from "date-fns";

const VALID_TYPES = new Set([
  "pattern",
  "prediction",
  "correlation",
  "motivation",
]);

function normalizeType(t: unknown): string {
  if (typeof t === "string" && VALID_TYPES.has(t)) return t;
  return "motivation";
}

export async function POST() {
  try {
    const env = getServerEnv();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentInsight } = await supabase
      .from("ai_insights")
      .select("id, generated_at")
      .eq("user_id", user.id)
      .gte("generated_at", oneDayAgo)
      .not("message", "like", "perfect-day-bonus:%")
      .limit(1);

    if (recentInsight && recentInsight.length > 0) {
      const generatedAt = new Date(recentInsight[0].generated_at);
      const retryAfter = Math.max(
        0,
        Math.ceil(
          (generatedAt.getTime() + 24 * 60 * 60 * 1000 - Date.now()) / 1000
        )
      );
      return NextResponse.json(
        { error: "Rate limited — one generation per day" },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        }
      );
    }

    const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");

    const [{ data: habits }, { data: logs }, { data: streaks }] =
      await Promise.all([
        supabase
          .from("habits")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true),
        supabase
          .from("habit_logs")
          .select("*")
          .eq("user_id", user.id)
          .gte("log_date", thirtyDaysAgo),
        supabase.from("streaks").select("*").eq("user_id", user.id),
      ]);

    if (!habits || habits.length === 0) {
      return NextResponse.json(
        { error: "Add some habits first" },
        { status: 400 }
      );
    }

    const prompt = buildInsightPrompt(habits, logs ?? [], streaks ?? []);

    const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Invalid AI response format" },
        { status: 500 }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json(
        { error: "AI returned malformed JSON" },
        { status: 500 }
      );
    }

    if (!Array.isArray(parsed)) {
      return NextResponse.json(
        { error: "AI did not return an array" },
        { status: 500 }
      );
    }

    const insightRows = parsed
      .filter(
        (i): i is { type: unknown; message: unknown } =>
          !!i && typeof i === "object" && "message" in i
      )
      .map((i) => ({
        user_id: user.id,
        insight_type: normalizeType(i.type),
        message: String(i.message).slice(0, 500),
      }))
      .filter((row) => row.message.length > 0);

    if (insightRows.length === 0) {
      return NextResponse.json(
        { error: "No usable insights returned" },
        { status: 500 }
      );
    }

    const { error: insertErr } = await supabase
      .from("ai_insights")
      .insert(insightRows);
    if (insertErr) {
      console.error("Insight insert error:", insertErr);
      return NextResponse.json(
        { error: "Failed to save insights" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, count: insightRows.length });
  } catch (err) {
    console.error("Insight generation error:", err);
    const isCreditIssue =
      err instanceof Error && /credit balance/i.test(err.message);
    if (isCreditIssue) {
      return NextResponse.json(
        { error: "AI provider out of credits. Try again later." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
