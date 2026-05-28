import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getVapidEnv } from "@/lib/env";
import webpush from "web-push";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let vapid;
  try {
    vapid = getVapidEnv();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "vapid missing";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
  webpush.setVapidDetails(
    vapid.VAPID_SUBJECT,
    vapid.VAPID_PUBLIC_KEY,
    vapid.VAPID_PRIVATE_KEY
  );

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("id,endpoint,p256dh,auth")
    .eq("user_id", user.id)
    .eq("is_active", true);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!subs || subs.length === 0) {
    return NextResponse.json(
      { error: "No active push subscription on this account" },
      { status: 400 }
    );
  }

  const payload = JSON.stringify({
    title: "StreakFlow test 🔔",
    body: "Push working. You'll get a real reminder at your set time.",
    tag: "test",
    data: { url: "/dashboard/settings" },
  });

  let sent = 0;
  let failed = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      );
      sent++;
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : "";
      // 410 Gone / 404 — subscription dead, deactivate
      if (/410|404/.test(msg)) {
        await supabase
          .from("push_subscriptions")
          .update({ is_active: false })
          .eq("id", sub.id);
      }
    }
  }

  if (sent === 0) {
    return NextResponse.json(
      { error: "Push send failed. Toggle off + on to re-subscribe." },
      { status: 502 }
    );
  }
  return NextResponse.json({ sent, failed });
}
