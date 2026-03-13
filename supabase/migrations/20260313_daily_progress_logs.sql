create table if not exists public.daily_progress_logs (
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null,
  mood_level integer check (mood_level between 1 and 5),
  energy_level integer check (energy_level between 1 and 5),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, log_date)
);

create index if not exists daily_progress_logs_user_id_log_date_idx
on public.daily_progress_logs (user_id, log_date desc);

alter table public.daily_progress_logs enable row level security;

grant select, insert, update, delete on public.daily_progress_logs to authenticated;

drop policy if exists "daily_progress_logs_select_own" on public.daily_progress_logs;
create policy "daily_progress_logs_select_own"
on public.daily_progress_logs
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "daily_progress_logs_insert_own" on public.daily_progress_logs;
create policy "daily_progress_logs_insert_own"
on public.daily_progress_logs
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "daily_progress_logs_update_own" on public.daily_progress_logs;
create policy "daily_progress_logs_update_own"
on public.daily_progress_logs
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.handle_daily_progress_logs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_daily_progress_logs_updated_at on public.daily_progress_logs;
create trigger set_daily_progress_logs_updated_at
before update on public.daily_progress_logs
for each row
execute function public.handle_daily_progress_logs_updated_at();
