import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { buildInsightPrompt } from "@/lib/utils/insights";
import { getCronEnv } from "@/lib/env";
import Anthropic from "@anthropic-ai/sdk";
import { format, subDays } from "date-fns";

// Weekly insight generation. Iterates active users (logged in last 14 days)
// and runs the Claude prompt for each. Uses service-role key to bypass RLS.
//
// Run via cron-job.org Monday 06:00 UTC. Authenticated via CRON_SECRET.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

export async function POST(request: Request) {
  const env = getCronEnv();
  const url = new URL(request.url);
  const provided =
    url.searchParams.get("key") ?? request.headers.get("x-cron-key");
  if (provided !== env.CRON_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not set" },
      { status: 500 }
    );
  }

  const supabase = createSupabaseClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  // Active users — anyone who logged a habit in last 14 days
  const fourteenDaysAgo = format(subDays(new Date(), 14), "yyyy-MM-dd");
  const { data: activeUsers, error: userErr } = await supabase
    .from("habit_logs")
    .select("user_id")
    .gte("log_date", fourteenDaysAgo);
  if (userErr) {
    return NextResponse.json({ error: userErr.message }, { status: 500 });
  }

  const uniqueUsers = Array.from(
    new Set((activeUsers ?? []).map((r) => r.user_id))
  );

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
  const oneWeekAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const results: Array<{
    user_id: string;
    status: "skipped" | "generated" | "error";
    count?: number;
    reason?: string;
  }> = [];

  for (const userId of uniqueUsers) {
    try {
      // Skip if user got insights in last 7 days
      const { data: recent } = await supabase
        .from("ai_insights")
        .select("id")
        .eq("user_id", userId)
        .gte("generated_at", oneWeekAgo)
        .not("message", "like", "perfect-day-bonus:%")
        .limit(1);
      if (recent && recent.length > 0) {
        results.push({ user_id: userId, status: "skipped", reason: "recent" });
        continue;
      }

      const [{ data: habits }, { data: logs }, { data: streaks }] =
        await Promise.all([
          supabase
            .from("habits")
            .select("*")
            .eq("user_id", userId)
            .eq("is_active", true),
          supabase
            .from("habit_logs")
            .select("*")
            .eq("user_id", userId)
            .gte("log_date", thirtyDaysAgo),
          supabase.from("streaks").select("*").eq("user_id", userId),
        ]);

      if (!habits || habits.length === 0) {
        results.push({
          user_id: userId,
          status: "skipped",
          reason: "no-habits",
        });
        continue;
      }

      const prompt = buildInsightPrompt(habits, logs ?? [], streaks ?? []);
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });
      const textBlock = message.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        results.push({ user_id: userId, status: "error", reason: "no-text" });
        continue;
      }
      const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        results.push({
          user_id: userId,
          status: "error",
          reason: "no-json",
        });
        continue;
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        results.push({
          user_id: userId,
          status: "error",
          reason: "bad-json",
        });
        continue;
      }
      if (!Array.isArray(parsed)) {
        results.push({
          user_id: userId,
          status: "error",
          reason: "not-array",
        });
        continue;
      }
      const insightRows = parsed
        .filter(
          (i): i is { type: unknown; message: unknown } =>
            !!i && typeof i === "object" && "message" in i
        )
        .map((i) => ({
          user_id: userId,
          insight_type: normalizeType(i.type),
          message: String(i.message).slice(0, 500),
        }))
        .filter((row) => row.message.length > 0);

      if (insightRows.length === 0) {
        results.push({
          user_id: userId,
          status: "error",
          reason: "no-usable",
        });
        continue;
      }

      const { error: insertErr } = await supabase
        .from("ai_insights")
        .insert(insightRows);
      if (insertErr) {
        results.push({
          user_id: userId,
          status: "error",
          reason: insertErr.message,
        });
        continue;
      }
      results.push({
        user_id: userId,
        status: "generated",
        count: insightRows.length,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      results.push({
        user_id: userId,
        status: "error",
        reason: msg.slice(0, 200),
      });
    }
  }

  return NextResponse.json({
    ranAt: new Date().toISOString(),
    totalUsers: uniqueUsers.length,
    generated: results.filter((r) => r.status === "generated").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    errors: results.filter((r) => r.status === "error").length,
    results,
  });
}
