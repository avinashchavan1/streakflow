-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Custom types
create type habit_type as enum ('binary', 'quantity', 'duration');
create type frequency_type as enum ('daily', 'weekdays', 'weekends', 'custom');
create type badge_category as enum ('streak', 'consistency', 'special', 'milestone');
create type insight_type as enum ('pattern', 'prediction', 'correlation', 'motivation');

-- Profiles
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default '',
  avatar_url text,
  xp integer not null default 0,
  level integer not null default 1,
  streak_freezes integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
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

-- Habits
create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null check (char_length(name) <= 50),
  icon text not null default '✅',
  color text not null default '#6C5CE7',
  habit_type habit_type not null default 'binary',
  target_value numeric,
  target_unit text,
  frequency frequency_type not null default 'daily',
  custom_days integer[],
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table habits enable row level security;
create policy "Users can view own habits" on habits for select using (auth.uid() = user_id);
create policy "Users can insert own habits" on habits for insert with check (auth.uid() = user_id);
create policy "Users can update own habits" on habits for update using (auth.uid() = user_id);
create policy "Users can delete own habits" on habits for delete using (auth.uid() = user_id);

-- Habit Logs
create table habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  log_date date not null,
  completed boolean not null default false,
  value numeric,
  logged_at timestamptz not null default now(),
  unique (habit_id, log_date)
);

alter table habit_logs enable row level security;
create policy "Users can view own logs" on habit_logs for select using (auth.uid() = user_id);
create policy "Users can insert own logs" on habit_logs for insert with check (auth.uid() = user_id);
create policy "Users can update own logs" on habit_logs for update using (auth.uid() = user_id);
create policy "Users can delete own logs" on habit_logs for delete using (auth.uid() = user_id);

-- Streaks
create table streaks (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade unique,
  user_id uuid not null references profiles(id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_completed_date date,
  freeze_used_dates date[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table streaks enable row level security;
create policy "Users can view own streaks" on streaks for select using (auth.uid() = user_id);
create policy "Users can insert own streaks" on streaks for insert with check (auth.uid() = user_id);
create policy "Users can update own streaks" on streaks for update using (auth.uid() = user_id);

-- Badges
create table badges (
  id text primary key,
  name text not null,
  description text not null,
  icon text not null,
  xp_reward integer not null default 0,
  category badge_category not null
);

alter table badges enable row level security;
create policy "Anyone can view badges" on badges for select using (true);

-- User Badges
create table user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  badge_id text not null references badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

alter table user_badges enable row level security;
create policy "Users can view own badges" on user_badges for select using (auth.uid() = user_id);
create policy "Users can insert own badges" on user_badges for insert with check (auth.uid() = user_id);

-- AI Insights
create table ai_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  insight_type insight_type not null,
  message text not null,
  generated_at timestamptz not null default now(),
  is_read boolean not null default false
);

alter table ai_insights enable row level security;
create policy "Users can view own insights" on ai_insights for select using (auth.uid() = user_id);
create policy "Users can insert own insights" on ai_insights for insert with check (auth.uid() = user_id);
create policy "Users can update own insights" on ai_insights for update using (auth.uid() = user_id);

-- Indexes
create index idx_habits_user_id on habits(user_id);
create index idx_habit_logs_habit_id on habit_logs(habit_id);
create index idx_habit_logs_user_date on habit_logs(user_id, log_date);
create index idx_streaks_user_id on streaks(user_id);
create index idx_user_badges_user_id on user_badges(user_id);
create index idx_ai_insights_user_id on ai_insights(user_id);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on profiles
  for each row execute function update_updated_at();

create trigger streaks_updated_at before update on streaks
  for each row execute function update_updated_at();
