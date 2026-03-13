create table if not exists public.cycle_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_period_date date not null,
  cycle_length_days integer not null check (cycle_length_days between 15 and 60),
  period_length_days integer not null check (period_length_days between 1 and 15),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint cycle_settings_period_before_cycle check (period_length_days < cycle_length_days)
);

alter table public.cycle_settings enable row level security;

grant select, insert, update, delete on public.cycle_settings to authenticated;

drop policy if exists "cycle_settings_select_own" on public.cycle_settings;
create policy "cycle_settings_select_own"
on public.cycle_settings
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "cycle_settings_insert_own" on public.cycle_settings;
create policy "cycle_settings_insert_own"
on public.cycle_settings
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "cycle_settings_update_own" on public.cycle_settings;
create policy "cycle_settings_update_own"
on public.cycle_settings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.handle_cycle_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_cycle_settings_updated_at on public.cycle_settings;
create trigger set_cycle_settings_updated_at
before update on public.cycle_settings
for each row
execute function public.handle_cycle_settings_updated_at();
