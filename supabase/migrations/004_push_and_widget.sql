-- Push notification subscriptions
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  reminder_hour smallint not null default 20, -- local hour to send "don't break streak" reminder
  reminder_tz text not null default 'UTC',
  is_active boolean not null default true,
  last_sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;
create policy "Users view own subscriptions" on push_subscriptions
  for select using (auth.uid() = user_id);
create policy "Users insert own subscriptions" on push_subscriptions
  for insert with check (auth.uid() = user_id);
create policy "Users update own subscriptions" on push_subscriptions
  for update using (auth.uid() = user_id);
create policy "Users delete own subscriptions" on push_subscriptions
  for delete using (auth.uid() = user_id);

create index idx_push_subscriptions_user on push_subscriptions(user_id);
create index idx_push_subscriptions_active on push_subscriptions(is_active, reminder_hour);

-- Widget keys (Scriptable iOS widget)
create table widget_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade unique,
  key text not null unique,
  created_at timestamptz not null default now()
);

alter table widget_keys enable row level security;
create policy "Users view own widget key" on widget_keys
  for select using (auth.uid() = user_id);
create policy "Users insert own widget key" on widget_keys
  for insert with check (auth.uid() = user_id);
create policy "Users delete own widget key" on widget_keys
  for delete using (auth.uid() = user_id);

create index idx_widget_keys_key on widget_keys(key);
