// Centralized env access with validation. Fails fast in dev / build.
// Browser-safe: only NEXT_PUBLIC_* are referenced from client code paths below.

function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

export const PUBLIC_ENV = {
  SUPABASE_URL: required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL
  ),
  SUPABASE_ANON_KEY: required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ),
  APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "",
};

// Server-only — never imported from client components.
export function getServerEnv() {
  return {
    ANTHROPIC_API_KEY: required(
      "ANTHROPIC_API_KEY",
      process.env.ANTHROPIC_API_KEY
    ),
    APP_URL: PUBLIC_ENV.APP_URL,
  };
}

// Cron-only — used by /api/cron/* routes. Service-role key bypasses RLS.
// Never imported anywhere except cron routes.
export function getCronEnv() {
  return {
    CRON_SECRET: required("CRON_SECRET", process.env.CRON_SECRET),
    SUPABASE_SERVICE_ROLE_KEY: required(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
    SUPABASE_URL: PUBLIC_ENV.SUPABASE_URL,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
  };
}
