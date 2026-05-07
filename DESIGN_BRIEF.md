# StreakFlow — UX/UI Design Brief

A self-contained brief for designing screens. Hand to a designer (or Claude design agent) and they should be able to mock all flows without further questions.

---

## 1. Product in one paragraph

**StreakFlow** is a gamified habit tracker. Users build daily habits (drink water, exercise, read, meditate, code, journal — anything custom too) and earn XP, badges, streaks, and AI-powered insights as they stick with them. The hook is "turn your daily routine into a game." Target users: 20–40 year olds who've tried Notion habit trackers, Habitica, Streaks, etc., and bounced because they were either too sterile or too RPG-cosplay. We want premium, calm, motivating — not childish.

Live: https://streakflow-app.netlify.app

---

## 2. North-star feel

| Adjective | Yes | No |
|---|---|---|
| Energy | Focused, calm-confident | Hyper, gamer-bro |
| Color | Deep dark base + 1 vibrant accent | Rainbow, pastel, neon overload |
| Type | Clean sans-serif, generous spacing | Pixel font, Comic Sans, ironic retro |
| Motion | Subtle, purposeful (streak flame flicker, XP count-up, badge unlock pop) | Heavy parallax, screen shakes, confetti everywhere |
| Voice | Encouraging, dry humor, second-person | Patronizing ("Great job, champion!"), corporate, gen-z meme |

Reference vibes: Linear (calm density), Things 3 (warmth + restraint), Apple Fitness (rings as identity), Duolingo (gamification done well — minus the green owl threats).

---

## 3. Brand tokens (current, change if better)

```
Primary       #6C5CE7  (indigo-violet, used for streak ring, primary CTAs, links)
Accent danger #FF4757  (streak break, warnings)
Accent warm   #FFA502  (flame icon, XP burst)
Success       #2ED573
Background    #0E0E11  (near-black, slight warm tint)
Surface       #16161B  (cards)
Surface-2     #1E1E25  (modals, raised)
Border        #2A2A33
Text-primary  #F5F5F7
Text-muted    #8E8E96

Font: Inter / system sans-serif
Radius: 12px (cards), 8px (inputs/buttons), 999px (pills, streak ring)
Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48
```

Designer is welcome to propose a new palette — keep dark mode as default, add light mode if time allows.

---

## 4. Information architecture

```
/                       Landing (marketing)
/login, /signup         Auth
/dashboard              Today view (default after login)
/dashboard/habits       All habits list + manage
/dashboard/habits/:id   Single habit detail (calendar, history, edit)
/dashboard/analytics    Charts: completion %, streak heatmap, time-of-day patterns
/dashboard/achievements Badge gallery (earned + locked)
/dashboard/insights     AI-generated weekly summary, predictions, correlations
```

Sidebar nav (desktop), bottom tab bar (mobile) for: Dashboard, Habits, Analytics, Achievements, Insights.

---

## 5. Screens to design (priority order)

### 5.1 Landing page `/`
- Hero: "Build habits that stick" — one tight sentence, primary CTA "Start Free", secondary "Sign In"
- Feature row (icons + 1-line each): Streaks · XP System · Badges · Analytics · AI Insights
- Optional: animated screenshot or product mock
- Footer: minimal — copyright, GitHub, privacy

### 5.2 Auth `/login` `/signup`
- Centered card, glass effect on dark background
- Signup: display name, email, password (min 6)
- Login: email, password, "Continue with Google" button (OAuth)
- Error states inline, no toast

### 5.3 Dashboard `/dashboard` — **most important screen**
The "today" view. User lands here daily. Must answer: *did I do my habits today?*
- **Header strip:** logo left, level + XP progress bar + avatar right
- **Today header:** date ("Thursday, May 7"), "Add Habit" CTA
- **Completion ring:** big circular progress showing X/Y habits done today, % in middle, motivating subtitle ("Let's get started!" / "Halfway there" / "Perfect day! 🎉")
- **Stat tiles row (3 tiles):** Total XP · Top Streak · Level (with name like "Starter", "Apprentice", "Adept"...)
- **Habits list (today):** each row = icon, name, type-aware status:
  - Binary habits: tap to check off, satisfying tick animation
  - Quantity habits ("0/8 glasses"): inline "Log" button → number input + Save
  - Duration habits ("0/30 min"): same pattern
  - When complete: row becomes filled state with checkmark + streak badge ("1d 🔥")
- **Active Streaks panel:** compact list of habits with current streak count, ranked
- Empty state: "No habits for today" + dart-target illustration + "Add your first habit"

### 5.4 Habits list `/dashboard/habits`
- Grid or list of all habits (active + archived tab)
- Each card: icon, name, type, frequency, current streak, longest streak, sparkline of last 30 days
- Reorder via drag handle
- Click → habit detail

### 5.5 Habit detail `/dashboard/habits/:id`
- Header: icon + name + edit/archive/delete menu
- **GitHub-style year heatmap** of completions
- Current streak (big number) + longest streak
- Last 30 logs as list with values (for quantity/duration)
- Edit panel: name, icon (emoji picker), color, type, target, unit, frequency

### 5.6 New Habit modal (triggered from "+ Add Habit")
- Quick templates row: 💧 Drink Water · 🏋️ Exercise · 📚 Read · 🧘 Meditate · 💻 Code · 📓 Journal
- Name (50 char max)
- Icon picker (emoji grid, ~16 curated)
- Color picker (10 swatches)
- Type: binary / quantity / duration
- If quantity/duration: target + unit (e.g. 8 glasses, 30 min)
- Frequency: daily / weekdays / weekends / custom (day-of-week toggle row)
- Submit: "Add Habit"

### 5.7 Analytics `/dashboard/analytics`
- Time range toggle: 7d / 30d / 90d / all
- Cards:
  - Overall completion % (big number + delta vs previous period)
  - Per-habit completion bar chart
  - Streak heatmap (calendar grid, color intensity = % of habits done that day)
  - Time-of-day histogram ("when you log most")
  - Day-of-week pattern

### 5.8 Achievements `/dashboard/achievements`
- 15 badges total (see list below). Earned = full color + earned date. Locked = grayscale + progress bar + criteria
- Group by category: Streak · Consistency · Special · Milestone
- Click a badge → modal with full description + share button

### 5.9 Insights `/dashboard/insights`
- AI-generated cards (Anthropic API) — types: pattern, prediction, correlation, motivation
- Each card: type tag, headline, 1–2 sentence body, generated date, dismiss
- "Refresh insights" CTA (rate-limited)
- Empty state: "Log a few more days and we'll surface patterns"

---

## 6. Gamification mechanics (keep these visible without being loud)

- **XP per habit completion:** binary 5, quantity/duration 7. Streak multiplier kicks in at 7d (×1.5), 30d (×2), 100d (×3).
- **Perfect day bonus:** +10 XP if all today's habits done.
- **Levels:** Starter (Lv 1) → Apprentice (Lv 2) → Adept (Lv 3) → ... → Transcendent (Lv 10). Curve: Lv N requires `100 * N^1.5` XP.
- **Streak freezes:** earn 1 per week, lets a missed day not break the streak. Surfaced in habit detail.

### Badge list (15)
| ID | Name | Trigger | Icon |
|---|---|---|---|
| first_step | First Step | Complete your first habit | 👣 |
| three_day | Three-peat | 3-day streak any habit | 🔥 |
| iron_week | Iron Week | All habits 7 straight days | 🦾 |
| two_week | Fortnight Fighter | 14-day streak | ⚔️ |
| monthly | Monthly Master | 30-day streak | 🏆 |
| sixty_days | Sixty & Counting | 60-day streak | 💎 |
| century | Century Club | 100-day streak | 👑 |
| perfect_week | Perfect Week | 100% for 7 days | ✨ |
| five_habits | Habit Collector | Tracking 5 habits | 🎯 |
| early_bird | Early Bird | Log before 7 AM × 7 days | 🌅 |
| comeback | Comeback Kid | Rebuild broken streak to 14d | 💪 |
| level_five | Halfway There | Reach Lv 5 | 🌟 |
| level_ten | Transcendent | Reach Lv 10 | 🔮 |
| thousand_xp | XP Hoarder | 1,000 total XP | 💰 |
| hydration_30 | Hydration Hero | Water goal 30 days straight | 💧 |

---

## 7. Key flows to storyboard

1. **First-run:** signup → empty dashboard → "Add Habit" CTA → template picker → first habit logged → micro-celebration → next-day return
2. **Daily check-in:** open app → see today ring at 0% → tap habits → ring fills → "Perfect day!" state at 100%
3. **Streak break + recover:** miss a day → streak resets to 0 (or freeze used) → next day shows "Restart your streak" framing, not shame
4. **Badge unlock:** complete trigger condition → modal slides in with badge art, name, description, +XP — dismissible, also added to gallery
5. **Level up:** XP bar fills, level chip animates, brief overlay "Lv 2 — Apprentice"

---

## 8. Responsive

- Desktop ≥1024: sidebar nav, 3-column dashboard layout
- Tablet 768–1023: collapsed sidebar (icons only), 2-column
- Mobile <768: bottom tab bar, single column, sticky "Add Habit" FAB

Mobile is where most real usage happens — design mobile first if forced to choose.

---

## 9. Accessibility musts

- WCAG AA contrast (current dark palette is borderline on muted text — verify)
- All habit interactions reachable by keyboard
- Reduced-motion respected (no streak flame flicker, instant XP count)
- Color is never the only signal (streak status uses icon + label too)

---

## 10. What not to design (out of scope)

- Social / friend feeds / leaderboards
- Paid tier / pricing page
- Onboarding tutorial carousel — we want the first habit to be the tutorial
- Email notifications UI (we'll do this later)

---

## 11. Tech context (in case it affects choices)

- Next.js 16 App Router, Tailwind v4, shadcn/ui components
- Supabase auth + Postgres (RLS on)
- Anthropic API for insights (server-only)
- Zustand client state, no Redux
- Designer can deliver Figma + tokens; engineering will translate. If using Claude design agent, output React/Tailwind components against shadcn/ui primitives is ideal.

---

## 12. Deliverables expected

1. Figma file (or component spec) covering all 9 screens above + new-habit modal + badge unlock modal
2. Mobile + desktop variants for dashboard, habits list, habit detail
3. Light + dark theme tokens (dark default)
4. Component inventory: Button, Input, Card, Modal, Pill, ProgressRing, Heatmap, BadgeTile, EmptyState, StatTile
5. 1 motion spec doc: streak flame, XP count-up, badge unlock, level-up — durations + easing

---

## 13. Open questions for the designer

- Should the streak ring use Apple-Fitness-style segmented rings if user has multiple habits, or one merged ring?
- Badge unlock: full-screen takeover, slide-in toast, or center modal? (Lean modal.)
- Insights tone: data-y ("78% of your runs happen between 6–8 AM") or motivational ("You're a morning person — lean into it")? (Lean blend.)
- Empty achievement gallery: show all 15 grayscale at once, or progressive reveal as you near each?

Resolve these in v1 review.
