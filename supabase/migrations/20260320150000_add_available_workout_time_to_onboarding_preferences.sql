do $$
begin
  if to_regclass('public.onboarding_preferences') is not null then
    alter table public.onboarding_preferences
    add column if not exists available_workout_time text not null default 'medium'
    check (available_workout_time in ('short', 'medium', 'long'));
  end if;
end
$$;
