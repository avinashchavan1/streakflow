create or replace function increment_xp(uid uuid, amount integer)
returns void as $$
begin
  update profiles
  set xp = xp + amount
  where id = uid;
end;
$$ language plpgsql security definer;
