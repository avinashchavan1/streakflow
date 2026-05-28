import type { Config } from "@netlify/functions";

// Scheduled wrapper — calls Next.js /api/cron/keepalive with the secret.
// Runs every 3 days at 03:00 UTC so the free Supabase tier doesn't pause.

export default async () => {
  const secret = process.env.CRON_SECRET;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://streakflow-app.netlify.app";
  if (!secret) {
    return new Response("missing CRON_SECRET", { status: 500 });
  }
  const res = await fetch(`${appUrl}/api/cron/keepalive?key=${secret}`);
  const body = await res.text();
  return new Response(
    JSON.stringify({ ok: res.ok, status: res.status, body: body.slice(0, 300) }),
    { status: res.ok ? 200 : 502, headers: { "content-type": "application/json" } }
  );
};

export const config: Config = {
  schedule: "0 3 */3 * *",
};
