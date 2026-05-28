import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getCronEnv } from "@/lib/env";
import { format } from "date-fns";

// Public widget feed. No auth — `key` is a per-user secret UUID.
// Returns minimal JSON: today's completion %, streak, top streak.

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  if (!key || key.length < 16) {
    return NextResponse.json({ error: "bad key" }, { status: 400 });
  }

  const env = getCronEnv();
  const supabase = createSupabaseClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const { data: keyRow } = await supabase
    .from("widget_keys")
    .select("user_id")
    .eq("key", key)
    .maybeSingle();
  if (!keyRow) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const userId = keyRow.user_id;

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [{ data: habits }, { data: todayLogs }, { data: streaks }, { data: profile }] =
    await Promise.all([
      supabase
        .from("habits")
        .select("id,name,icon,color,target_value,habit_type")
        .eq("user_id", userId)
        .eq("is_active", true),
      supabase
        .from("habit_logs")
        .select("habit_id,completed,value")
        .eq("user_id", userId)
        .eq("log_date", todayStr),
      supabase
        .from("streaks")
        .select("habit_id,current_streak,longest_streak")
        .eq("user_id", userId),
      supabase.from("profiles").select("xp,level,display_name").eq("id", userId).single(),
    ]);

  const total = habits?.length ?? 0;
  const doneCount =
    todayLogs?.filter((l) => l.completed).length ?? 0;
  const completionPct = total === 0 ? 0 : Math.round((doneCount / total) * 100);
  const topStreak = Math.max(
    0,
    ...(streaks ?? []).map((s) => s.current_streak ?? 0)
  );

  return NextResponse.json(
    {
      ranAt: new Date().toISOString(),
      displayName: profile?.display_name ?? "",
      level: profile?.level ?? 1,
      xp: profile?.xp ?? 0,
      totalCount: total,
      doneCount,
      completionPct,
      topStreak,
      habits: (habits ?? []).map((h) => {
        const log = todayLogs?.find((l) => l.habit_id === h.id);
        const streak =
          streaks?.find((s) => s.habit_id === h.id)?.current_streak ?? 0;
        return {
          name: h.name,
          icon: h.icon,
          color: h.color,
          completed: !!log?.completed,
          value: log?.value ?? 0,
          target: h.target_value,
          streak,
        };
      }),
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    }
  );
}
