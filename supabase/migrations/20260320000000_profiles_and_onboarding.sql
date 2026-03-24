create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  units text not null default 'metric' check (units in ('metric', 'imperial')),
  goal text,
  fitness_level text not null default 'beginner' check (fitness_level in ('beginner', 'intermediate', 'advanced')),
  timezone text not null default 'UTC',
  last_seen_phase text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles enable row level security;

grant select, insert, update, delete on public.profiles to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.handle_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.handle_profiles_updated_at();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name, timezone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'timezone', 'UTC')
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

create table if not exists public.onboarding_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  equipment_access text[] not null default '{}'::text[],
  weekly_training_days text not null default '3-4' check (weekly_training_days in ('1-2', '3-4', '5+')),
  riding_environment text not null default 'mixed' check (riding_environment in ('indoor', 'outdoor', 'mixed')),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.onboarding_preferences enable row level security;

grant select, insert, update, delete on public.onboarding_preferences to authenticated;

drop policy if exists "onboarding_preferences_select_own" on public.onboarding_preferences;
create policy "onboarding_preferences_select_own"
on public.onboarding_preferences
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "onboarding_preferences_insert_own" on public.onboarding_preferences;
create policy "onboarding_preferences_insert_own"
on public.onboarding_preferences
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "onboarding_preferences_update_own" on public.onboarding_preferences;
create policy "onboarding_preferences_update_own"
on public.onboarding_preferences
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.handle_onboarding_preferences_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_onboarding_preferences_updated_at on public.onboarding_preferences;
create trigger set_onboarding_preferences_updated_at
before update on public.onboarding_preferences
for each row
execute function public.handle_onboarding_preferences_updated_at();
