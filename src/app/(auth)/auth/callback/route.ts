import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PUBLIC_ENV } from "@/lib/env";

// Allow only same-origin path redirects (must start with "/" but not "//" or "/\")
function safeNext(value: string | null): string {
  if (!value) return "/dashboard";
  if (!value.startsWith("/")) return "/dashboard";
  if (value.startsWith("//") || value.startsWith("/\\")) return "/dashboard";
  return value;
}

function canonicalOrigin(): string {
  if (PUBLIC_ENV.APP_URL) {
    try {
      return new URL(PUBLIC_ENV.APP_URL).origin;
    } catch {
      // fall through
    }
  }
  return "";
}

export async function GET(request: Request) {
  const { searchParams, origin: requestOrigin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));
  const origin = canonicalOrigin() || requestOrigin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
