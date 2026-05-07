insert into badges (id, name, description, icon, xp_reward, category) values
  ('first_step', 'First Step', 'Complete your first habit', '👣', 10, 'milestone'),
  ('three_day', 'Three-peat', '3-day streak on any habit', '🔥', 25, 'streak'),
  ('iron_week', 'Iron Week', 'Complete ALL habits for 7 straight days', '🦾', 100, 'consistency'),
  ('two_week', 'Fortnight Fighter', '14-day streak on any habit', '⚔️', 75, 'streak'),
  ('monthly', 'Monthly Master', '30-day streak on any habit', '🏆', 200, 'streak'),
  ('sixty_days', 'Sixty & Counting', '60-day streak on any habit', '💎', 350, 'streak'),
  ('century', 'Century Club', '100-day streak on any habit', '👑', 500, 'streak'),
  ('perfect_week', 'Perfect Week', '100% completion for 7 days', '✨', 150, 'consistency'),
  ('five_habits', 'Habit Collector', 'Track 5 habits simultaneously', '🎯', 50, 'milestone'),
  ('early_bird', 'Early Bird', 'Log a habit before 7 AM for 7 days', '🌅', 75, 'special'),
  ('comeback', 'Comeback Kid', 'Rebuild a broken streak to 14+ days', '💪', 100, 'special'),
  ('level_five', 'Halfway There', 'Reach Level 5', '🌟', 0, 'milestone'),
  ('level_ten', 'Transcendent', 'Reach Level 10', '🔮', 0, 'milestone'),
  ('thousand_xp', 'XP Hoarder', 'Earn 1,000 total XP', '💰', 0, 'milestone'),
  ('hydration_30', 'Hydration Hero', 'Hit water goal 30 days in a row', '💧', 150, 'special')
on conflict (id) do nothing;
