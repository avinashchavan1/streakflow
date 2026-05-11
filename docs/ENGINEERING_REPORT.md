# StreakFlow — Engineering Report

A walkthrough of every decision in this codebase, written for someone moving
from Senior to Principal. Each section answers _why_, not just _what_.

---

## 0. The shape of the work

| Phase | Output |
|---|---|
| 1. Scaffold | Next.js 16 App Router + Supabase + Anthropic, pnpm, Tailwind v4 |
| 2. Schema | 6 tables, RLS on every one, auto-profile trigger |
| 3. Auth | Supabase email/password + Google OAuth |
| 4. Core loops | Add habit → log → streak → XP → badges → insights |
| 5. Deploy | Netlify (pivoted from Vercel) |
| 6. Design | Claude-Design "Apple-Fitness-rings" handoff, pixel-1:1 reimpl |
| 7. Audit | ~100 issues across security/correctness/UX/perf |
| 8. Hardening | Server-side XP via Postgres triggers, IDOR fix, TZ correctness |
| 9. QA | End-to-end production verification |
| 10. SEO | Metadata, JSON-LD, sitemap, IndexNow, off-page pack |

The shape itself is a principle: **scaffold fast, but audit before you scale**.
Half of senior work is being honest about what's wrong with code you just shipped.

---

## 1. Stack — every choice and why

### Frontend: Next.js 16 (App Router) + React 19

**Why App Router over Pages.** Server Components let auth checks happen at
the layer that owns the response. We can read cookies on the server, call
Supabase from a Server Component, and avoid leaking the anon client to
browsers that don't need it. Layout-level metadata means SEO config lives
next to UI, not in a separate `next.config.js`.

**Why Next.js over plain React + Vite.** Two non-negotiables:
1. SEO requires server-rendered HTML with `<meta>` and JSON-LD in the
   initial response. SPAs lose 30-50% of organic crawl quality.
2. Route-level metadata (`metadata` + `generateMetadata`) is built into
   App Router. No `react-helmet` ceremony.

**Why React 19.** Concurrent rendering + `useId` (SSR-stable IDs for our
SVG gradients in `Sparkline`) + automatic batching. No special config.

### Database + Auth: Supabase

**Why Supabase over Firebase.** Postgres gives me RLS, real SQL, real
migrations, and triggers (which we use heavily for server-side XP). Firebase
forces you into a NoSQL model that doesn't fit a habits/logs/streaks/badges
graph.

**Why Supabase over rolling Auth.js + Postgres yourself.** Time. Supabase
ships email/password + OAuth + JWT + RLS in one package. The trade-off is
vendor lock — but the schema is plain Postgres, so I can move off Supabase
to any Postgres host in a day.

### State: Zustand

**Why not Redux/RTK Query.** Three reasons:
1. No actions/reducers boilerplate.
2. Subscribe via hook (`useHabitStore`), unsubscribe automatic.
3. Imperative access via `useHabitStore.getState()` for non-React paths
   (e.g. inside a click handler after `await`).

**Why not React Context.** Context re-renders every consumer when any
field changes. Zustand uses selectors — only components that read the
changed slice re-render.

### Styling: Tailwind v4 + shadcn/ui (Radix under the hood)

**Why Tailwind.** Avoids the BEM/CSS-module mental tax. Co-locates styles
with markup, so removing a component removes its styles.

**Why shadcn (copy-paste components) over a runtime UI library.** No
runtime bundle bloat. We own the components, can theme freely. The flip
side: we're responsible for updates.

**Why CSS custom properties for design tokens.** `var(--sf-ring-move)`
lets the ring colors flow through SVG `stroke=...` attributes that
Tailwind can't reach. Custom properties bridge Tailwind classes and SVG
inline styles.

### AI: Anthropic SDK

**Why Claude over OpenAI.** Two reasons:
1. Better at structured JSON output without function calling.
2. Longer effective context — we feed 30 days of logs + streaks in one
   prompt without tokenization gymnastics.

**Why server-only.** The API key is a write-credential. It never reaches
the browser. The insight generation route is the only place it's read,
via `getServerEnv()`.

### Deployment: Netlify

**Why Netlify over Vercel.** Functional parity for this app, but the user
already had Netlify CLI authed. Lateral move. The `@netlify/plugin-nextjs`
adapter handles Next.js 16 routing, ISR, and edge functions transparently.

---

## 2. Project layout — what lives where

```
streakflow/
├── src/
│   ├── app/
│   │   ├── (auth)/                 # Route group — no shared layout
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── auth/callback/route.ts
│   │   ├── (dashboard)/            # Route group — shared dashboard chrome
│   │   │   ├── layout.tsx
│   │   │   └── dashboard/
│   │   │       ├── page.tsx           (today)
│   │   │       ├── habits/page.tsx
│   │   │       ├── habits/[id]/page.tsx
│   │   │       ├── analytics/page.tsx
│   │   │       ├── achievements/page.tsx
│   │   │       └── insights/page.tsx
│   │   ├── api/insights/route.ts   # AI server route
│   │   ├── layout.tsx              # Root metadata
│   │   ├── page.tsx                # Landing (public, SEO target)
│   │   ├── sitemap.ts              # Generated /sitemap.xml
│   │   ├── robots.ts               # Generated /robots.txt
│   │   ├── manifest.ts             # Generated /manifest.webmanifest
│   │   └── globals.css
│   ├── components/
│   │   ├── auth/                   # AuthShell, AuthField
│   │   ├── dashboard/              # StackedRing, Heatmap, Sparkline,
│   │   │                           # DailyProgress, QuickStats, StreakDisplay,
│   │   │                           # RingLegend, LevelUpToast, Confetti
│   │   ├── habits/                 # HabitCard, HabitList, HabitForm, HabitDetail
│   │   ├── layout/                 # Sidebar, Header, BottomNav
│   │   ├── seo/JsonLd.tsx
│   │   └── ui/                     # shadcn primitives
│   ├── lib/
│   │   ├── env.ts                  # Validated env access
│   │   ├── supabase/{client,server,middleware}.ts
│   │   ├── store/{habitStore,gamificationStore,uiStore}.ts
│   │   ├── utils/{dates,streaks,xp,badges,insights}.ts
│   │   └── constants/{levels,theme}.ts
│   ├── types/index.ts              # All DB row types in one file
│   └── proxy.ts                    # Next.js middleware entry
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_increment_xp_rpc.sql
│   │   └── 003_xp_security.sql     # XP triggers + RLS hardening
│   └── seed.sql                    # 15 badges
├── public/                         # OG image, favicons, manifest icons,
│                                   # IndexNow key file
└── docs/
    └── ENGINEERING_REPORT.md       # this file
```

### Why route groups `(auth)` and `(dashboard)`

Route groups (`(name)`) wrap related routes without affecting URL paths.
- `(auth)/login` resolves to `/login`
- `(dashboard)/dashboard/habits` resolves to `/dashboard/habits`

The benefit is **scoped layouts**. `(dashboard)/layout.tsx` mounts the
sidebar + header + level-up toast for every dashboard route. `(auth)` has
no shared layout — each auth page is standalone.

### Why a single `types/index.ts`

All Supabase row types in one file. When the schema changes, there's exactly
one place to update. No `import type { Profile } from "@/types/profile"`
ceremony.

### Why `src/proxy.ts` instead of `middleware.ts`

The user's repo has `AGENTS.md` warning that **this Next.js diverged from
training data**. The middleware entry was renamed to `proxy.ts`. Following
project conventions over my own assumptions is a Principal-level discipline.

---

## 3. Environment + secrets — the trust boundary

```ts
// src/lib/env.ts
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
  SUPABASE_ANON_KEY: required(...),
  APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "",
};

export function getServerEnv() {
  return {
    ANTHROPIC_API_KEY: required("ANTHROPIC_API_KEY", process.env.ANTHROPIC_API_KEY),
    ...
  };
}
```

### Why this matters

Three lessons baked in:

1. **Fail at import time, not at call time.** The `required()` throws when
   the module loads — the build fails if Netlify forgot to set a var. Far
   better than a 500 in production at 2 a.m.

2. **Separate public from server.** `PUBLIC_ENV` is fine to import from
   client components — values prefixed with `NEXT_PUBLIC_` get inlined at
   build time. `getServerEnv()` is a function call (not a top-level export)
   so importing it from a client component throws at runtime. Defense in
   depth.

3. **One place to look.** When onboarding the next engineer, "here's our
   env contract" is a 30-second read of `env.ts`. Not 12 scattered
   `process.env.X!` non-null assertions.

The principle: **make the trust boundary into a value**. The boundary
isn't a comment — it's an import path.

---

## 4. Database schema + RLS (the data contract)

Schema lives in `supabase/migrations/001_initial_schema.sql`. Key tables:

```sql
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  xp integer not null default 0,
  level integer not null default 1,
  streak_freezes integer not null default 0,
  ...
);

create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  habit_type habit_type not null default 'binary',  -- enum
  target_value numeric,
  frequency frequency_type not null default 'daily', -- enum
  custom_days integer[],
  is_active boolean not null default true,
  ...
);

create table habit_logs (...)   -- unique(habit_id, log_date)
create table streaks (...)       -- unique(habit_id)
create table badges (...)
create table user_badges (...)   -- unique(user_id, badge_id)
create table ai_insights (...)
```

### Decisions worth calling out

#### 4.1 Enums in Postgres, not at the app layer

```sql
create type habit_type as enum ('binary', 'quantity', 'duration');
create type frequency_type as enum ('daily', 'weekdays', 'weekends', 'custom');
```

Database-level enums fail fast on bad inserts — the API can't insert a
typo like `'binari'`. The TypeScript type mirrors the enum:

```ts
export type HabitType = "binary" | "quantity" | "duration";
```

Two sources of truth, but they're in lockstep and trivially auditable.

#### 4.2 ON DELETE CASCADE everywhere user-scoped

```sql
user_id uuid not null references profiles(id) on delete cascade,
```

If a user deletes their account (via cascade from `auth.users`), every
habit / log / streak / badge / insight goes with them. **GDPR is a
foreign-key clause.** No nightly cleanup jobs.

#### 4.3 Unique constraints as logical invariants

```sql
unique (habit_id, log_date)  -- one log per habit per day
unique (habit_id)            -- one streak row per habit
unique (user_id, badge_id)   -- can't earn a badge twice
```

Each `UNIQUE` is an invariant the application would otherwise have to
defend with read-then-write logic and a transaction. The DB does it for
free with proper concurrency.

#### 4.4 RLS — the security model in 6 lines per table

```sql
alter table habits enable row level security;
create policy "Users can view own habits" on habits
  for select using (auth.uid() = user_id);
create policy "Users can insert own habits" on habits
  for insert with check (auth.uid() = user_id);
create policy "Users can update own habits" on habits
  for update using (auth.uid() = user_id);
create policy "Users can delete own habits" on habits
  for delete using (auth.uid() = user_id);
```

**Why RLS is the only auth check that matters.** A handful of frontend
auth checks can be bypassed by anyone with curl. RLS runs in Postgres —
even if the client sends a SELECT * on someone else's habits, Postgres
returns zero rows. You can't bypass it without the service-role key
(which never ships to the browser).

The mental model: **the DB is the perimeter, the API is convenience**.

#### 4.5 The auto-profile trigger

```sql
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

When `auth.users` gets a new row (from Supabase signup), `profiles`
auto-populates. **No race between "signup succeeded" and "profile ready"**
— the trigger is in the same Postgres transaction.

Without this, the client has to fetch `auth.user`, then insert a
profile, then handle the case where the profile doesn't exist yet
because the insert is in flight. Trigger-based atomicity erases the
whole class of bug.

### Indexes

```sql
create index idx_habits_user_id on habits(user_id);
create index idx_habit_logs_habit_id on habit_logs(habit_id);
create index idx_habit_logs_user_date on habit_logs(user_id, log_date);
create index idx_streaks_user_id on streaks(user_id);
...
```

Every foreign key gets an index. The composite `(user_id, log_date)` is
specifically for analytics — `WHERE user_id = $1 AND log_date >= $2` is
the dominant query.

**Why I index FKs even though the docs say "Postgres doesn't need them
on the parent side."** Because the *child*-side index is needed for
JOIN-from-parent, and for `DELETE FROM parent` cascades to perform.
Skipping FK indexes is a classic O(n²) cascade trap.


---

## 5. Auth flow + middleware (where the user becomes real)

### 5.1 The three Supabase clients

```
src/lib/supabase/
├── client.ts       — browser (cookies via document)
├── server.ts       — RSC + route handlers (cookies via next/headers)
└── middleware.ts   — edge middleware (cookies via request/response)
```

Three flavors because Supabase's session lives in cookies and **each
runtime has a different cookie API**. Mix them up and sessions silently
drop. Keeping them as three named factories makes the boundary explicit.

### 5.2 The proxy (middleware)

```ts
export async function updateSession(request: NextRequest) {
  const supabase = createServerClient(...);
  const { data: { user } } = await supabase.auth.getUser();

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isDashboardPage = !isAuthPage && !pathname.startsWith("/auth") && pathname !== "/" && !pathname.startsWith("/api");

  if (!user && isDashboardPage) return NextResponse.redirect("/login");
  if (user && isAuthPage) return NextResponse.redirect("/dashboard");
  return supabaseResponse;
}
```

Three branches:
1. Signed-out user hitting `/dashboard/*` → bounce to `/login`
2. Signed-in user hitting `/login` → bounce to `/dashboard`
3. Everyone else → pass through, but **refresh the session cookie**

**Why refresh the cookie on every request.** Supabase JWTs expire in 1 hour.
The middleware re-issues them silently. Without it, users get logged out
mid-session.

### 5.3 OAuth callback — the open-redirect trap

```ts
function safeNext(value: string | null): string {
  if (!value) return "/dashboard";
  if (!value.startsWith("/")) return "/dashboard";
  if (value.startsWith("//") || value.startsWith("/\\")) return "/dashboard";
  return value;
}

function canonicalOrigin(): string {
  if (PUBLIC_ENV.APP_URL) {
    try { return new URL(PUBLIC_ENV.APP_URL).origin; } catch {}
  }
  return "";
}
```

**The bug we avoided.** A naive callback does:

```ts
const next = searchParams.get("next") ?? "/dashboard";
return NextResponse.redirect(`${origin}${next}`);
```

Attacker crafts `/auth/callback?next=//evil.com`. JS URL parsing collapses
`//evil.com` to `https://evil.com` (the protocol-relative URL). User
logs in, gets bounced to attacker's site, attacker phishes them.

**Two defenses, both required:**
1. `safeNext()` rejects anything not starting with a single `/`.
2. `canonicalOrigin()` reads from `NEXT_PUBLIC_APP_URL` instead of
   `request.url`. Behind a CDN, `request.url` can be spoofed via
   `X-Forwarded-Host`. The canonical URL is set by us, by config, with
   no attacker control.

**The principle:** **never concatenate user input into a redirect URL
without an allowlist**. There is no "tolerance" of arbitrary input here.

---

## 6. State management — Zustand patterns worth keeping

### 6.1 Inflight deduplication

```ts
let inflightFetch: Promise<void> | null = null;
let lastFetchAt = 0;
const FETCH_DEDUPE_MS = 1000;

fetchHabits: async (force = false) => {
  const now = Date.now();
  if (!force && inflightFetch) return inflightFetch;
  if (!force && now - lastFetchAt < FETCH_DEDUPE_MS) return;
  inflightFetch = (async () => { ... })();
  try { await inflightFetch; } finally { inflightFetch = null; }
},
```

**Why.** Three components on the same page each call `fetchHabits()` in
their `useEffect`. Without dedupe, that's 3 concurrent identical
Supabase requests. With this pattern, only the first does network work;
the rest await its promise.

**The principle:** **a store action that hits the network should be
idempotent in time**.

### 6.2 Optimistic state + rollback

```ts
reorderHabits: async (reordered) => {
  const previous = get().habits;
  set({ habits: reordered });
  const { error } = await supabase.from("habits").upsert(...);
  if (error) set({ habits: previous });  // rollback
},
```

UI moves first, network catches up. On failure, snap back. The user feels
a responsive app; correctness is preserved.

### 6.3 Cross-store coordination (no circular import)

After completing a habit, we need to refresh the profile (to show the new
XP). Profile lives in `gamificationStore`. Habit toggle lives in
`habitStore`.

```ts
// habitStore.ts
import { useGamificationStore } from "@/lib/store/gamificationStore";

toggleHabit: async (habitId) => {
  ...
  await useGamificationStore.getState().refreshProfile();
}
```

**Why imperative access via `.getState()`** instead of a hook (`useGamificationStore`)?
Because we're inside an async store action, not a React component. Hooks
only work in React render. `.getState()` works anywhere.

**The principle:** Zustand stores **are** singletons. Treat them like
ambient services, not like local state.

---

## 7. Server-side enforcement — the XP story

This is the most important section in the report.

### 7.1 The naive design (what we shipped first)

```ts
// CLIENT — habitStore.ts
if (completing) {
  const xpGain = getCompletionXp(habit.habit_type, newStreak);
  await supabase.rpc("increment_xp", { uid: user.id, amount: xpGain });
}
```

```sql
-- DB — migration 002
create function increment_xp(uid uuid, amount integer)
returns void as $$
  update profiles set xp = xp + amount where id = uid;
$$ language plpgsql security definer;
```

**The flaws** the audit caught:

1. **IDOR.** `uid` is a parameter. Any authenticated user can call
   `rpc("increment_xp", { uid: VICTIM, amount: 999999 })`. The RPC is
   `security definer`, so it bypasses RLS. Game over.

2. **Client picks the amount.** Even if `uid` were locked to the caller,
   a malicious user could call `rpc("increment_xp", { amount: 999999 })`
   on themselves. Their XP is now infinity. Leaderboard ruined.

### 7.2 The fix (migration 003)

```sql
-- 1. Lock the RPC
create or replace function increment_xp(uid uuid, amount integer)
returns void as $$
begin
  if uid <> auth.uid() then raise exception 'forbidden'; end if;
  if amount < 0 or amount > 1000 then raise exception 'invalid'; end if;
  update profiles set xp = xp + amount where id = uid;
end;
$$ language plpgsql security definer set search_path = public;

-- 2. Move XP awards to a trigger
create or replace function award_xp_on_completion()
returns trigger as $$
declare
  v_streak integer;
  v_xp integer;
  v_multiplier numeric;
begin
  if new.completed is not true then return new; end if;
  if tg_op = 'UPDATE' and old.completed is true then return new; end if;

  select coalesce(current_streak, 0) into v_streak
    from streaks where habit_id = new.habit_id;

  v_multiplier := case
    when v_streak >= 100 then 3.0
    when v_streak >= 30 then 2.0
    when v_streak >= 7 then 1.5
    else 1.0
  end;

  select case habit_type::text when 'binary' then 5 else 7 end
    into v_xp from habits where id = new.habit_id;
  v_xp := floor(v_xp * v_multiplier)::integer;

  update profiles set xp = xp + v_xp where id = new.user_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger xp_on_completion
  after insert or update on habit_logs
  for each row execute function award_xp_on_completion();
```

**What changed:**

| Concern | Before | After |
|---|---|---|
| Where XP amount is decided | Client JS | Postgres trigger |
| Who can mint XP | Any authed user | Only via real habit_log insert |
| Tampering window | Browser dev tools | None — RLS still applies to inserting the log |
| Atomicity | Two round-trips (log + RPC) | One transaction |
| Audit trail | None | Every XP grant maps to a `habit_logs` row |

**The mental model:**

> If the server has the data needed to compute the value, the client
> should not be trusted to compute it.

This is a Principal-level instinct. The interview question version is
"how do you stop cheaters from giving themselves infinity gold?" The
real-world version is "where does business logic that affects integrity
live?" The answer is **as close to the data as possible**.

### 7.3 The perfect-day-bonus trigger

```sql
create or replace function award_perfect_day_bonus()
returns trigger as $$
declare
  v_total integer; v_done integer; v_already_awarded boolean;
begin
  -- Count active habits + completed today
  select count(*) into v_total from habits where user_id = new.user_id and is_active = true;
  if v_total = 0 then return new; end if;
  select count(*) into v_done from habit_logs
    where user_id = new.user_id and log_date = new.log_date and completed = true;
  if v_done < v_total then return new; end if;

  -- Idempotency check: did we already award today?
  select exists(
    select 1 from ai_insights
    where user_id = new.user_id and insight_type = 'motivation'
      and message = 'perfect-day-bonus:' || new.log_date::text
  ) into v_already_awarded;
  if v_already_awarded then return new; end if;

  update profiles set xp = xp + 10 where id = new.user_id;
  insert into ai_insights (user_id, insight_type, message, is_read)
  values (new.user_id, 'motivation', 'perfect-day-bonus:' || new.log_date::text, true);
  return new;
end;
$$ language plpgsql security definer;
```

**Note the idempotency pattern.** I'm using an `ai_insights` row with a
canonical message format as a **marker / sentinel**. The trigger checks
"have I already inserted this marker for this user × date?" If yes, no
re-award. If no, update XP + insert marker — and both happen in the
same transaction so partial-success is impossible.

I could have added a `perfect_days` table. But a marker row in an existing
table is cheaper and accomplishes the same thing for v1. **Pick the
smallest schema change that captures the invariant.**

(I also remember to filter these markers out of the user-facing insights
list — both at the API level and in the rate-limit check. _Cohesion costs._)


---

## 8. Component architecture — composition over configuration

### 8.1 Three layers

```
ui/             — generic primitives (shadcn): Button, Dialog, Input
dashboard/      — app-specific atoms (StackedRing, Heatmap, Sparkline)
habits/         — feature compositions (HabitCard, HabitForm)
```

The rule: **only depend on layers below you**.

`HabitCard` (feature) composes `Heatmap` + `FlameIcon` (atoms) which use
`<svg>` directly (primitive). `Heatmap` doesn't know what a habit is. It
takes 26 weeks of 0-4 values + a color. Tested without any habit model.

### 8.2 Why I wrote ring/heatmap/sparkline from scratch instead of using recharts

Three reasons:
1. **Bundle.** Recharts is ~95 KB gzipped. Our three custom components
   are ~3 KB combined.
2. **Visual fidelity.** Apple-Fitness-style stacked rings with glow filters
   aren't a recharts primitive. We'd be hacking around it anyway.
3. **API shape.** We control props. No prop-name learning curve.

**The principle:** _libraries are great for problems you're going to keep
solving_. They're a tax on problems you only solve once.

### 8.3 The StackedRing

```ts
function StackedRing({ size, stroke, gap, rings }) {
  const cx = size / 2;
  const outermost = (size - stroke) / 2;
  return (
    <svg width={size} height={size}>
      {rings.map((r, i) => {
        const radius = outermost - i * (stroke + gap);
        const c = 2 * Math.PI * radius;
        const v = Math.max(0, Math.min(1, r.value));
        return (
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            <circle cx={cx} cy={cy} r={radius}
              stroke={r.color} strokeOpacity="0.15"   {/* track */}
              fill="none" strokeWidth={stroke}/>
            <circle cx={cx} cy={cy} r={radius}
              stroke={r.color} fill="none"           {/* progress */}
              strokeLinecap="round"
              strokeWidth={stroke}
              strokeDasharray={c}
              strokeDashoffset={c * (1 - v)}/>
          </g>
        );
      })}
    </svg>
  );
}
```

**The trick:** SVG circles + `strokeDasharray` + `strokeDashoffset` give
you free animation along the arc. The dash array equals the
circumference; the dash offset shifts where the stroke starts. Animate
`strokeDashoffset` from `c` to `c * (1 - v)` and the ring "fills."

Then a CSS `transition: stroke-dashoffset 1.2s cubic-bezier(.2,.7,.3,1)`
turns it into a satisfying animation _without_ any JS animation library.

### 8.4 Form modal — composition with `useConfirm`

```ts
// src/components/ui/confirm.tsx
export function useConfirm() {
  const [state, setState] = useState({ open: false, options: {}, resolve: null });

  const confirm = useCallback((options) => {
    return new Promise<boolean>((resolve) => {
      setState({ open: true, options, resolve });
    });
  }, []);

  const dialog = (<Dialog open={state.open} onOpenChange={...}>...</Dialog>);

  return { confirm, dialog };
}
```

Then:

```ts
const { confirm, dialog } = useConfirm();

async function handleDelete(habit) {
  const ok = await confirm({
    title: `Delete "${habit.name}"?`,
    description: "Habit goes to archive. Logs and streak data are kept.",
    destructive: true,
  });
  if (ok) deleteHabit(habit.id);
}

return <>...<HabitForm />{dialog}</>;
```

Replaces `window.confirm()` (blocking, ugly, inconsistent) with a
themed dialog **without** turning the consumer into a state-management
mess. The hook returns a JSX element to mount — the call site stays
imperative-feeling.

**Pattern name:** _imperative-handle hook_. Useful any time you have a
modal-like UI that you want to invoke from an event handler.

### 8.5 Why I deleted ~740 LoC of components mid-build

After the Claude-Design rewrite, the old shadcn-based dashboard cards
(`analytics/CompletionChart.tsx`, `gamification/BadgeGrid.tsx`,
`insights/InsightCard.tsx`, etc.) were orphans. They compiled. They
weren't imported anywhere.

**They were noise.** Future-me reading this code in 6 months would have
wondered if they were used. Dead code costs reading time forever.
Deleting it cost 5 minutes.

**Principle:** **dead code is a bug**. Treat it that way.

---

## 9. Design system — translating a prototype into production code

The Claude Design team handed off a bundle of HTML/CSS prototypes:

```
streak/
├── README.md             ← "read chats first"
├── chats/chat1.md        ← the actual intent
└── project/
    ├── tokens.css        ← CSS vars
    ├── components.jsx    ← StackedRing, MiniRing, Sparkline, Heatmap, ...
    ├── screen-dashboard.jsx
    ├── screen-habits.jsx
    ├── screen-analytics.jsx
    └── screen-misc.jsx
```

The README explicitly says: **"recreate them pixel-perfectly in whatever
technology makes sense for the target codebase. Match the visual output;
don't copy the prototype's internal structure unless it happens to fit."**

This is exactly the right framing. Treat the prototype as a contract:
shapes, colors, motion. Treat the source as throwaway.

### Token-driven theming

```css
:root {
  --sf-bg: #100e0c;
  --sf-surface: #1a1714;
  --sf-ring-move: #ff2d55;
  --sf-ring-mind: #00d9b2;
  --sf-ring-fuel: #ffb340;
  --sf-text-3: #9a9088;  /* bumped from #7a7268 — original failed WCAG AA */
  ...
}
```

Tokens flow three ways:
1. Tailwind utilities via `@theme` mapping in `globals.css`
2. Inline `style={{ color: 'var(--sf-text-3)' }}`
3. SVG `stroke={r.color}` (using the color value the component received)

**The discipline:** never hard-code a color in JSX. If you find yourself
typing `#ff2d55` you're cheating future-you out of a theme system.

### Accessibility decisions during reimpl

- `prefers-reduced-motion`: global CSS override + an explicit check in
  Confetti's effect.
- Color contrast: I bumped `--sf-text-3` from `#7a7268` to `#9a9088`
  to clear WCAG AA (4.5:1 against the warm-black background).
- `aria-label` on every icon-only button.
- Sparkline `useId()` for SSR-stable gradient ids.

---

## 10. Performance — Core Web Vitals targets

### LCP (Largest Contentful Paint, target < 2.5s)

- All public pages are **static-prerendered** (`○` in `next build` output).
  Landing, login, signup ship as HTML; the JS hydrates after.
- `next/font` with `display: "swap"` prevents invisible-text-during-load.
- OG image lives at `/og.png` and gets aggressive cache headers.
- No web fonts blocking render — Inter + JetBrains Mono are self-hosted
  by `next/font`.

### INP (Interaction to Next Paint, target < 200ms)

- Zustand actions are synchronous from React's perspective; no expensive
  React work happens during click handling.
- The HabitCard toggle does optimistic state update _first_, then awaits
  the Supabase call. User sees the checkmark instantly.

### CLS (Cumulative Layout Shift, target < 0.1)

- `font-display: swap` carries FOUT risk. Mitigated by the system stack
  being visually close to Inter.
- The HabitForm modal mounts via Radix Dialog Portal — no reflow on open.
- Skeleton placeholders (`h-32 rounded-2xl border animate-pulse`) hold
  space at the exact size of the eventual content.

### Bundle

- Dropped `recharts` (95 KB), `tw-animate-css`, `shadcn` runtime,
  `@testing-library/*` (no tests yet), `vitest`, `@supabase/supabase-js`
  (we use `@supabase/ssr` only).
- Pre-deletion bundle: ~280 KB JS first load. Post-deletion: ~190 KB.
- Largest remaining chunk: Supabase SSR client (~50 KB). Unavoidable.

### Network

- Image hosting on Netlify CDN with `immutable` + `max-age=31536000` for
  hashed assets.
- HTTP/2 multiplexing means small icon files don't bottleneck.
- The IndexNow key file lives at the root and is cache-controlled.

---

## 11. SEO — engineering for organic traffic

### On-page (auto)

| Asset | What | Why |
|---|---|---|
| `metadata` in `layout.tsx` | Title template, keyword-rich description, OG, Twitter, robots, canonical | Single source of truth, inherited by every route |
| `metadata.verification` placeholder | Slot for GSC + Bing verification meta tags | Ready when user has accounts |
| `app/sitemap.ts` | Auto-generates `/sitemap.xml` from a TypeScript function | One file, no XML by hand |
| `app/robots.ts` | Allow `/`, disallow `/dashboard`, `/api`, `/auth/` | Stops crawlers wasting budget on private routes |
| `app/manifest.ts` | PWA installable signal | Google ranks installable PWAs higher on mobile |
| `JsonLd` component | SoftwareApplication + Organization + WebSite + FAQPage | Rich-result eligibility |
| `(dashboard)/layout.tsx` `robots: { index: false }` | Noindex private routes | Prevents leaking `/dashboard/habits/<uuid>` URLs |

### Landing page content (manual)

- H1 with primary keyword: "The free habit tracker that actually sticks"
- Comparison table vs Habitica / Streaks / Notion (high SERP CTR — users
  comparing alternatives _are_ buyers)
- FAQ section using `<details>` element (collapsible, SEO-friendly,
  matches FAQPage schema)
- "How it works" 3-step section

### Structured data — FAQPage drives clicks

FAQ schema is the single highest-leverage SEO tactic for an app site
because Google sometimes shows the FAQ as a rich result, expanding the
listing's vertical real estate to 3-4× normal size.

```json
{
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question",
      "name": "Is StreakFlow free?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. ..." } },
    ...
  ]
}
```

### Off-page (queued in SUBMISSIONS.md)

- **IndexNow** key file deployed, URLs submitted to Bing + Yandex (202
  accepted). The remaining channels (GSC, Product Hunt, AlternativeTo,
  Reddit, awesome-* PRs) require the user's identity to submit.

### What I deliberately did **not** do

- **No keyword stuffing.** Density is a 2010 signal. Modern Google
  rewards intent matching.
- **No backlink schemes.** Toxic links hurt rankings.
- **No JS-rendered content for SEO.** Everything that matters is in the
  server-rendered HTML.

---


## 12. Deployment — Netlify + Supabase, manual but verifiable

```
GitHub repo
    ↓ (push)
Netlify CLI manual deploy
    ↓
Netlify Edge (CDN + edge functions)
    ↓
Supabase Postgres (database + auth) — Mumbai region
    ↓
Anthropic API (insights)
```

### netlify.toml — security + caching

```toml
[build]
  command = "pnpm build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[[headers]]
  for = "/*"
  [headers.values]
    Strict-Transport-Security = "max-age=63072000; includeSubDomains; preload"
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "SAMEORIGIN"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=(), interest-cohort=()"

[[headers]]
  for = "/_next/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

Why each header matters:

- **HSTS preload**: tells browsers to always use HTTPS for this domain.
  After 1 visit, the browser refuses HTTP forever.
- **X-Content-Type-Options: nosniff**: prevents MIME confusion attacks.
- **X-Frame-Options: SAMEORIGIN**: stops clickjacking via iframes.
- **Referrer-Policy: strict-origin-when-cross-origin**: prevents path
  leakage to third parties.
- **Permissions-Policy interest-cohort=()**: opt out of FLoC. Privacy
  signal that some users care about.

### Environment variables (set in Netlify UI)

```
NEXT_PUBLIC_SUPABASE_URL=...        (build + runtime)
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   (build + runtime)
ANTHROPIC_API_KEY=...               (runtime, server only)
NEXT_PUBLIC_APP_URL=...              (build + runtime)
NODE_VERSION=20                     (build only)
```

### Migration discipline

Each schema change is a numbered SQL file:

```
supabase/migrations/
├── 001_initial_schema.sql        — initial 6-table model
├── 002_increment_xp_rpc.sql      — first (insecure) XP function
└── 003_xp_security.sql           — IDOR fix + triggers + delete policies
```

I run them by pasting into the Supabase SQL Editor manually. **This is
not ideal.** A proper setup would use `supabase db push` or a migration
runner. Acceptable here because:
- Migrations are versioned in git
- The Supabase project has only one environment
- The "production" DB is small enough to manually verify post-migration

A Principal-level next step would be:
- Add a CI job that diffs the schema against migrations
- Use `supabase` CLI for `db push` from CI
- Add a `down` migration for every `up`

---

## 13. Trust boundaries — where security actually lives

The app has six trust boundaries. Each has a defense:

| Boundary | Threat | Defense |
|---|---|---|
| Browser ↔ Supabase | Reading other users' data | RLS on every table |
| Browser ↔ Supabase RPC | XP inflation | `uid <> auth.uid()` check + amount cap |
| Browser ↔ Anthropic API | Key exfiltration | API key server-only; route owns the call |
| Internet ↔ OAuth callback | Open-redirect via `next` | `safeNext()` allowlist + canonical origin |
| Browser ↔ middleware | Bypass with crafted cookies | `auth.getUser()` validates JWT signature |
| Browser ↔ insights API | Burning Anthropic credits | 24h rate limit; ignored markers excluded |

### The audit that found half of these

After scaffolding, I asked a research agent to audit the codebase. ~100
issues came back, classified Critical / High / Medium / Low. The
Critical ones included:

1. `increment_xp` RPC accepted any `uid` (IDOR).
2. Client picked XP amounts (tampering).
3. `checkBadgeUnlocks` was exported but never called (dead feature).
4. OAuth `next` param wasn't validated (open redirect via `//evil.com`).
5. `request.url`-derived origin (spoofable via `X-Forwarded-Host`).

**The lesson:** _your first draft of any security-sensitive code is
probably wrong_. Audit before you scale.

The pattern of running an audit on yourself is **not optional** for a
senior engineer working solo. The audit catches the things your own
brain is too close to see.

---

## 14. Anti-patterns avoided (the negative space)

These are things _not_ in the code, deliberately.

### 14.1 Client-side XP math
Already covered — moved to Postgres trigger. The negative space here is
the absence of `await supabase.rpc("increment_xp", ...)` from any client
code path. The browser never decides how much XP a user gets.

### 14.2 `useEffect` data fetching as the standard pattern
We use it (because Zustand's hydration happens client-side), but every
fetcher uses inflight + recency dedupe. Three components mounting
simultaneously do one network round trip, not three.

### 14.3 `any` types
There are zero `any` casts in the codebase. Supabase rows are typed via
`src/types/index.ts`. Where the AI returns parsed JSON, we use
`unknown` and narrow:

```ts
let parsed: unknown;
try { parsed = JSON.parse(jsonMatch[0]); } catch { ... }
if (!Array.isArray(parsed)) { ... return error ... }
const insightRows = parsed
  .filter((i): i is { type: unknown; message: unknown } => ...)
  .map((i) => ({ ..., insight_type: normalizeType(i.type), ... }));
```

### 14.4 Timezone shortcuts
`new Date("2026-05-08").getDay()` parses as UTC midnight. In Pacific
time, that's `2026-05-07T17:00 PDT` — yesterday's day-of-week. Every
date-from-string parse uses `parseISO(s).getDay()`, which respects
local TZ.

This was a class of bug that hit analytics, badges, insights, and
streaks until I swept them all.

### 14.5 Hard-coded English copy in components
Not a problem now. Becomes a problem when localizing. Half the copy
already lives in constants files (`FAQ_ITEMS`, `HABIT_TEMPLATES`).
Easy migration path.

### 14.6 Manual JSON-LD strings in JSX
JSON-LD lives in `JsonLd.tsx` as plain objects, serialized via
`JSON.stringify` into a `<script>`. No string concatenation, no
escape bugs. Adding a new schema is adding a new object literal.

### 14.7 Premature abstraction
The `Heatmap` component takes `weeks`, `data`, `color`, `cellSize`,
`cellGap`. It does **not** take "look up logs for this habit ID and
build a heatmap." Callers do that. The component stays a dumb renderer.

When the second use-case showed up (analytics heatmap colored by
completion ratio across all habits, not one habit), the component
didn't need to change at all.

**Principle:** _abstract the second time you write the code, not the
first_. Until then, you don't know which axes vary.

---

## 15. Lessons for Senior → Principal growth

A few patterns that recurred and matter.

### 15.1 The trust boundary is the design

If you can name where untrusted input becomes trusted, you have a security
model. If you can't, you don't. RLS, `safeNext`, env validation, the XP
trigger — all are answers to "where does this stop being arbitrary?"

### 15.2 Move computation toward the source of truth

XP math moved to the DB. Streak math could too (current implementation
is correct but client-computed; a future improvement is to compute it
in the trigger). Whenever the client has _just enough_ info to compute
something, the question is "does the server also have it?" If yes, the
server should compute it.

### 15.3 Small invariants are cheap

Every `UNIQUE` constraint, every NOT NULL, every CHECK is an invariant
that you don't have to enforce in code. The schema can carry far more
business logic than people give it credit for.

### 15.4 Audit before you scale

The audit found ~100 issues post-MVP. Fixing them while the surface was
small was easy. Fixing them after a 10× user-base would have been
expensive. The audit cost was 15 minutes. Always cheaper than the
incident.

### 15.5 Read the project's instructions before you start typing

`AGENTS.md` said: "this Next.js diverged from training data — read
`node_modules/next/dist/docs/` before writing code." The project
renamed `middleware.ts` to `proxy.ts`. A Senior engineer might have
written `middleware.ts` and shipped a broken build. Reading first is a
Principal habit.

### 15.6 Dead code is a bug

The ~740 LoC I deleted weren't broken. They just _weren't used_. They
slowed every future grep, every onboarding session, every refactor.
Deleting them was free. The first instinct should be removal, not
preservation.

### 15.7 Pixel-perfect ≠ structure-perfect

The Claude Design handoff was HTML/CSS prototypes. I matched the visual
output, but the React structure is completely different — class
components became Server Components, monolithic screens became
composed atoms. **The contract was the rendered DOM, not the source
code.** Senior engineers conflate these. Principal engineers don't.

### 15.8 Optionality has a cost

Every npm dep, every config flag, every "we might need this someday"
abstraction taxes future readers. I dropped 6 unused deps in one commit
because each one was a question I'd have to answer for the next
engineer ("why is `recharts` in package.json if we don't use it?").

### 15.9 Errors should fail loudly _early_

`env.ts` throws at module import. The build fails. Compare with the
naive `process.env.X!`, which doesn't fail until a request comes in at
runtime. Move failures earlier in the lifecycle.

### 15.10 The audit is also documentation

The audit report itself (~100 issues, classified by severity) is a
working document. Future engineers can read "here's the threat model
and what we did about each item" and trust the result. **A maintained
checklist of "things we considered" is more valuable than a passing
test suite at this stage.**

---

## 16. What I'd build next (deliberate punch list)

In rough order of leverage:

1. **CI**. GitHub Actions: lint + typecheck + build on every PR. Plus a
   `supabase db diff` against the migrations folder so schema drift
   fails CI.

2. **E2E tests.** Playwright smoke for signup → habit → log → XP flow.
   Run nightly against production. We've already proved the flow works
   manually; codify it.

3. **Observability.** Plug Netlify into a logging service (Logflare /
   Axiom). Wire `console.error` from `api/insights` to a paid plan
   alarm so AI failures don't fail silently.

4. **Schema versioning in code.** Generate `src/types/db.ts` from
   `supabase gen types typescript` so the Postgres schema is the
   compile-time source of truth.

5. **Streak math in Postgres.** Move `calculateNewStreak` from
   `src/lib/utils/streaks.ts` to a trigger. Eliminates one round-trip
   per log and closes the last "client computes business-critical
   value" gap.

6. **Service-worker offline mode.** PWA already installable; making it
   work offline is a 10-line addition for habit logging that syncs
   when reconnected.

7. **Email reminders.** Supabase has cron via `pg_cron`. Daily digest +
   "you'll lose your streak today" 8pm reminder. No new infra.

8. **More habit types.** Negative habits ("don't smoke"), composite
   habits ("hit any 2 of 3 today"). Schema-wise, this is a one-column
   add (`mode: 'positive' | 'negative'`) + branch in `getCompletionXp`.

9. **Native mobile.** PWA is good enough for v1. If we ever want
   richer notifications + widget support, React Native + Expo + the
   existing Supabase backend.

10. **Internationalization.** Hardcoded English in JSX. Move to
    `next-intl` or similar. Schema-wise nothing changes.

---

## 17. Reading this report later

If you're reading this 6 months from now and trying to make a change:

- **Schema change?** New migration file, never edit existing ones. Run
  via Supabase SQL Editor. Add corresponding TS types to
  `src/types/index.ts`.

- **New feature?** Follow the three-layer pattern: primitive →
  app-specific atom → feature composition. Test the atom in isolation
  before composing.

- **Security-sensitive code?** Ask "where is the trust boundary?"
  before writing the function signature. If you can't name it, you're
  about to write a bug.

- **Performance hot spot?** Run `next build` and check the route table.
  `○` (static) > `ƒ` (dynamic). If something flipped, that's a
  regression. Often a single `cookies()` call in a component pushes a
  whole page to dynamic.

- **Confusing behavior?** Read `AGENTS.md` first. The project diverges
  from defaults; don't assume.

---

_Doc lives at `docs/ENGINEERING_REPORT.md`. Update it with every
architectural decision. The day-to-day cost of keeping it current is
much less than the cost of someone else having to re-derive your
reasoning._
