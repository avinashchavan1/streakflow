-- Lock down increment_xp: caller must match uid (no IDOR)
create or replace function increment_xp(uid uuid, amount integer)
returns void as $$
begin
  if uid is null or auth.uid() is null or uid <> auth.uid() then
    raise exception 'forbidden: caller must match uid';
  end if;
  if amount is null or amount < 0 or amount > 1000 then
    raise exception 'invalid amount';
  end if;
  update profiles
  set xp = xp + amount
  where id = uid;
end;
$$ language plpgsql security definer set search_path = public;

-- Trigger-based XP award: source of truth is server-side
-- Fires when habit_logs row inserted or updated to completed=true
create or replace function award_xp_on_completion()
returns trigger as $$
declare
  v_habit habits%rowtype;
  v_streak integer;
  v_xp integer;
  v_multiplier numeric;
begin
  -- Only award when transitioning to completed
  if new.completed is not true then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.completed is true then
    return new;
  end if;

  select * into v_habit from habits where id = new.habit_id;
  if not found then
    return new;
  end if;

  select coalesce(current_streak, 0) into v_streak
  from streaks where habit_id = new.habit_id;

  -- Streak multipliers (matches src/lib/utils/xp.ts)
  v_multiplier := case
    when v_streak >= 100 then 3.0
    when v_streak >= 30 then 2.0
    when v_streak >= 7 then 1.5
    else 1.0
  end;

  -- Base XP per type
  v_xp := case v_habit.habit_type::text
    when 'binary' then 5
    else 7
  end;
  v_xp := floor(v_xp * v_multiplier)::integer;

  update profiles
  set xp = xp + v_xp
  where id = new.user_id;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists xp_on_completion on habit_logs;
create trigger xp_on_completion
  after insert or update on habit_logs
  for each row execute function award_xp_on_completion();

-- Perfect-day bonus: +10 XP when all today's habits completed
create or replace function award_perfect_day_bonus()
returns trigger as $$
declare
  v_total integer;
  v_done integer;
  v_already_awarded boolean;
begin
  if new.completed is not true then
    return new;
  end if;

  -- Count active habits scheduled today (frequency=daily as proxy; matches client filter)
  select count(*) into v_total
  from habits
  where user_id = new.user_id
    and is_active = true;

  if v_total = 0 then
    return new;
  end if;

  -- Count completed today
  select count(*) into v_done
  from habit_logs
  where user_id = new.user_id
    and log_date = new.log_date
    and completed = true;

  if v_done < v_total then
    return new;
  end if;

  -- Avoid double-award: check if perfect-day insight row already exists for the date
  select exists(
    select 1 from ai_insights
    where user_id = new.user_id
      and insight_type = 'motivation'
      and message = 'perfect-day-bonus:' || new.log_date::text
  ) into v_already_awarded;

  if v_already_awarded then
    return new;
  end if;

  update profiles
  set xp = xp + 10
  where id = new.user_id;

  insert into ai_insights (user_id, insight_type, message, is_read)
  values (new.user_id, 'motivation', 'perfect-day-bonus:' || new.log_date::text, true);

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists perfect_day_bonus on habit_logs;
create trigger perfect_day_bonus
  after insert or update on habit_logs
  for each row execute function award_perfect_day_bonus();

-- Tighten missing RLS policies
create policy "Users can delete own profile" on profiles
  for delete using (auth.uid() = id);

create policy "Users can delete own streaks" on streaks
  for delete using (auth.uid() = user_id);

create policy "Users can delete own badges" on user_badges
  for delete using (auth.uid() = user_id);

create policy "Users can delete own insights" on ai_insights
  for delete using (auth.uid() = user_id);
