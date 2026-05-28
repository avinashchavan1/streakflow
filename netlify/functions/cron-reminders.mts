import type { Config } from "@netlify/functions";

// Scheduled wrapper — calls Next.js /api/cron/reminders with the secret.
// Runs hourly at :00 — sends "don't break streak" pushes to users whose
// reminder_hour matches local time in their tz and have habits incomplete.

export default async () => {
  const secret = process.env.CRON_SECRET;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://streakflow-app.netlify.app";
  if (!secret) {
    return new Response("missing CRON_SECRET", { status: 500 });
  }
  const res = await fetch(`${appUrl}/api/cron/reminders?key=${secret}`, {
    method: "POST",
  });
  const body = await res.text();
  return new Response(
    JSON.stringify({ ok: res.ok, status: res.status, body: body.slice(0, 500) }),
    { status: res.ok ? 200 : 502, headers: { "content-type": "application/json" } }
  );
};

export const config: Config = {
  schedule: "0 * * * *",
};
