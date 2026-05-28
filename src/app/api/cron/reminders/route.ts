import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getCronEnv } from "@/lib/env";
import webpush from "web-push";
import { format } from "date-fns";

// Hourly cron — sends "don't break your streak" reminders for users whose
// reminder_hour matches the local hour in their reminder_tz and who have
// not yet logged all habits today.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface PushSub {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  reminder_hour: number;
  reminder_tz: string;
}

function localHourInTz(tz: string): number {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: tz,
    });
    return parseInt(dtf.format(new Date()), 10);
  } catch {
    return new Date().getUTCHours();
  }
}

export async function POST(request: Request) {
  const env = getCronEnv();
  const url = new URL(request.url);
  const provided =
    url.searchParams.get("key") ?? request.headers.get("x-cron-key");
  if (provided !== env.CRON_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT;
  if (!vapidPublic || !vapidPrivate || !vapidSubject) {
    return NextResponse.json(
      { error: "VAPID env not configured" },
      { status: 500 }
    );
  }
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  const supabase = createSupabaseClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("is_active", true);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const allSubs = (subs ?? []) as PushSub[];

  // Filter to subs whose reminder_hour matches local hour
  const due = allSubs.filter((s) => localHourInTz(s.reminder_tz) === s.reminder_hour);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const results: Array<{ user_id: string; status: string; reason?: string }> = [];

  for (const sub of due) {
    try {
      // Check if user has incomplete habits today
      const [{ data: habits }, { data: logs }] = await Promise.all([
        supabase
          .from("habits")
          .select("id")
          .eq("user_id", sub.user_id)
          .eq("is_active", true),
        supabase
          .from("habit_logs")
          .select("habit_id")
          .eq("user_id", sub.user_id)
          .eq("log_date", todayStr)
          .eq("completed", true),
      ]);
      const totalCount = habits?.length ?? 0;
      const doneCount = logs?.length ?? 0;
      if (totalCount === 0) {
        results.push({ user_id: sub.user_id, status: "skipped", reason: "no-habits" });
        continue;
      }
      if (doneCount >= totalCount) {
        results.push({ user_id: sub.user_id, status: "skipped", reason: "all-done" });
        continue;
      }

      const remaining = totalCount - doneCount;
      const payload = JSON.stringify({
        title: "Don't break your streak 🔥",
        body: `${remaining} habit${remaining === 1 ? "" : "s"} left for today.`,
        tag: "daily-reminder",
        data: { url: "/dashboard" },
      });

      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      );

      await supabase
        .from("push_subscriptions")
        .update({ last_sent_at: new Date().toISOString() })
        .eq("id", sub.id);

      results.push({ user_id: sub.user_id, status: "sent" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      // 410 Gone = subscription expired, deactivate it
      if (/410|404/.test(msg)) {
        await supabase
          .from("push_subscriptions")
          .update({ is_active: false })
          .eq("id", sub.id);
      }
      results.push({
        user_id: sub.user_id,
        status: "error",
        reason: msg.slice(0, 200),
      });
    }
  }

  return NextResponse.json({
    ranAt: new Date().toISOString(),
    totalSubs: allSubs.length,
    dueSubs: due.length,
    sent: results.filter((r) => r.status === "sent").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    errors: results.filter((r) => r.status === "error").length,
    results,
  });
}
