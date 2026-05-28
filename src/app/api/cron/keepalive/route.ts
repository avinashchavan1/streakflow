import { NextResponse } from "next/server";
import { PUBLIC_ENV } from "@/lib/env";

// Public keep-alive ping. Hits Supabase REST so the free tier doesn't pause
// after 7 days inactivity. Safe to expose — only reads a publicly readable
// row from `badges`. Protected by optional CRON_SECRET to limit abuse.

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const url = new URL(request.url);
    const provided = url.searchParams.get("key") ?? request.headers.get("x-cron-key");
    if (provided !== secret) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  const res = await fetch(
    `${PUBLIC_ENV.SUPABASE_URL}/rest/v1/badges?select=id&limit=1`,
    {
      headers: {
        apikey: PUBLIC_ENV.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${PUBLIC_ENV.SUPABASE_ANON_KEY}`,
      },
      cache: "no-store",
    }
  );
  const body = await res.text();
  return NextResponse.json(
    {
      ok: res.ok,
      status: res.status,
      sample: body.slice(0, 120),
      ranAt: new Date().toISOString(),
    },
    { status: res.ok ? 200 : 502 }
  );
}
