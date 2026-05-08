# StreakFlow

Gamified habit tracker. Stacked rings, streaks, XP, badges, AI insights.

Live: https://streakflow-app.netlify.app

## Stack

- Next.js 16 (App Router) · React 19 · Tailwind v4 · shadcn/ui · Zustand
- Supabase (Postgres + RLS + auth)
- Anthropic Claude API for weekly insights
- Netlify deploy via `@netlify/plugin-nextjs`

## Local setup

1. `pnpm install`
2. Copy `.env.local` (see env vars below) — never commit it
3. Apply migrations + seed in Supabase SQL editor:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_increment_xp_rpc.sql`
   - `supabase/migrations/003_xp_security.sql`
   - `supabase/seed.sql`
4. Disable email confirmation in Supabase Auth → Providers → Email
5. `pnpm dev --port 3002`

## Required env vars

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
ANTHROPIC_API_KEY=...        # server-only — never exposed to client
NEXT_PUBLIC_APP_URL=http://localhost:3002
```

`src/lib/env.ts` validates these at import time. Missing values fail the build loudly.

## Architecture

- **Auth + RLS**: every table has row-level policies keyed off `auth.uid()`.
- **XP + perfect-day bonus**: awarded server-side via Postgres triggers on
  `habit_logs` insert/update. Client never picks the amount. The
  `increment_xp` RPC enforces caller-must-equal-uid and a 1000 cap.
- **Badges**: `checkBadgeUnlocks` runs after every completion in
  `habitStore.toggleHabit`/`logHabitValue`, inserts into `user_badges`.
- **OAuth callback**: `/auth/callback` validates the `next` param against
  same-origin paths only, redirects via canonical `NEXT_PUBLIC_APP_URL`.

## Deploy

```
netlify deploy --build --prod
```

Env vars must be set in Netlify project settings.

## Design

`DESIGN_BRIEF.md` is the source of intent. The implementation matches the
"Apple-Fitness-rings" prototype from Claude Design.
